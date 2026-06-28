import { TaskRemoteService } from "../services/task.remote.service.js";
import {
	getPendingOperations,
	getPendingTaskIds,
	markOperationFailed,
	markOperationSynced,
	markOperationSyncing,
	removeOperation,
} from "./queue.repository.js";
import {
	getSyncState,
	initializeSyncState,
	updateLastPulledAt,
	updateLastPushedAt,
	updateLastSuccessfulSyncAt,
} from "./sync.repository.js";
import {
	getAllTasks,
	getTaskById,
	hardDeleteTask,
	upsertTask,
} from "./task.repository.js";

function nowIso() {
	return new Date().toISOString();
}

function safeTimestamp(value) {
	if (!value) return 0;
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? 0 : time;
}

function remoteToLocalTask(remote, userId) {
	const timestamp = remote.updated_at || remote.created_at || nowIso();

	return {
		id: remote.id,
		user_id: remote.user_id ?? userId,

		title: remote.title,
		description: remote.description ?? null,

		status: remote.status ?? "todo",
		priority: remote.priority ?? "medium",

		due_at: remote.due_at ?? null,
		reminder_at: remote.reminder_at ?? null,
		completed_at: remote.completed_at ?? null,

		sort_order: remote.sort_order ?? 0,
		is_pinned: !!remote.is_pinned,
		is_recurring: !!remote.is_recurring,
		recurrence_rule: remote.recurrence_rule ?? null,

		metadata: remote.metadata ?? {},

		sync_version: remote.sync_version ?? 1,
		last_synced_at: remote.last_synced_at ?? remote.updated_at ?? nowIso(),
		last_modified_by: remote.last_modified_by ?? null,

		deleted_at: remote.deleted_at ?? null,
		archived_at: remote.archived_at ?? null,

		sync_status: "synced",
		is_dirty: false,
		local_updated_at: timestamp,

		created_at: remote.created_at ?? timestamp,
		updated_at: remote.updated_at ?? timestamp,
	};
}

function hasUnsyncedLocalChanges(localTask, pendingTaskIds) {
	if (!localTask) return false;
	return localTask.is_dirty || pendingTaskIds.has(localTask.id);
}

function chooseWinner(localTask, remoteTask, pendingTaskIds) {
	if (!localTask) return remoteTask;
	if (!remoteTask) return localTask;

	// Never overwrite local rows that still have pending outbound changes.
	if (hasUnsyncedLocalChanges(localTask, pendingTaskIds)) {
		return localTask;
	}

	const localVersion = localTask.sync_version ?? 1;
	const remoteVersion = remoteTask.sync_version ?? 1;

	if (remoteVersion !== localVersion) {
		return remoteVersion > localVersion ? remoteTask : localTask;
	}

	const localTime = safeTimestamp(
		localTask.local_updated_at ?? localTask.updated_at,
	);
	const remoteTime = safeTimestamp(remoteTask.updated_at);

	return remoteTime >= localTime ? remoteTask : localTask;
}

async function applySyncedRemoteTask(userId, remoteTask) {
	await upsertTask(remoteToLocalTask(remoteTask, userId));
}

async function applyPushResult(userId, _operation, result) {
	if (!result?.data) {
		return;
	}

	await applySyncedRemoteTask(userId, result.data);
}

function isAlreadyDeletedError(operation, result) {
	return (
		operation.operation === "delete" &&
		!result?.success &&
		(result?.status === 404 || result?.status === 410)
	);
}

function isDuplicateCreateError(operation, result) {
	return (
		operation.operation === "create" &&
		!result?.success &&
		(result?.status === 409 || result?.status === 400)
	);
}

async function pushPendingOperations(userId) {
	const pendingOperations = await getPendingOperations(userId);

	const summary = {
		total: pendingOperations.length,
		success: 0,
		failed: 0,
	};

	for (const operation of pendingOperations) {
		try {
			await markOperationSyncing(operation.id);

			let result = null;

			if (operation.operation === "create") {
				result = await TaskRemoteService.create({
					...operation.payload,
					id: operation.task_id,
					client_timestamp: nowIso(),
				});
			} else if (operation.operation === "update") {
				result = await TaskRemoteService.update(operation.task_id, {
					...operation.payload,
					client_timestamp: nowIso(),
				});
			} else if (operation.operation === "delete") {
				result = await TaskRemoteService.remove(operation.task_id);
			} else if (operation.operation === "restore") {
				result = await TaskRemoteService.restore(operation.task_id);
			} else {
				throw new Error(`Unsupported operation: ${operation.operation}`);
			}

			if (
				!result?.success &&
				!isAlreadyDeletedError(operation, result) &&
				!isDuplicateCreateError(operation, result)
			) {
				const message = result?.message || "Failed to sync operation.";
				await markOperationFailed(operation.id, message);
				summary.failed += 1;
				continue;
			}

			if (result?.success) {
				await applyPushResult(userId, operation, result);
			} else if (operation.operation === "delete") {
				// Remote row is already gone — keep local soft-delete as synced.
				const localTask = await getTaskById(userId, operation.task_id, {
					includeDeleted: true,
				});

				if (localTask) {
					await upsertTask({
						...localTask,
						is_dirty: false,
						sync_status: "synced",
						last_synced_at: nowIso(),
					});
				}
			} else if (operation.operation === "create") {
				// Task already exists remotely — pull canonical row on next sync.
				const remoteTask = await TaskRemoteService.getById(operation.task_id);

				if (remoteTask.success && remoteTask.data) {
					await applySyncedRemoteTask(userId, remoteTask.data);
				}
			}

			await markOperationSynced(operation.id);
			await removeOperation(operation.id);
			await updateLastPushedAt(userId, nowIso());

			summary.success += 1;
		} catch (error) {
			await markOperationFailed(operation.id, error?.message || "Sync failed.");
			summary.failed += 1;
		}
	}

	return summary;
}

async function pullRemoteTasks(userId, updatedAfter = null) {
	const pendingTaskIds = await getPendingTaskIds(userId);

	const remoteResult = await TaskRemoteService.getAll({
		includeDeleted: true,
		updatedAfter,
	});

	if (!remoteResult.success) {
		throw new Error(remoteResult.message || "Failed to fetch remote tasks.");
	}

	const remoteTasks = Array.isArray(remoteResult.data) ? remoteResult.data : [];
	const localTasks = await getAllTasks({ userId, includeDeleted: true });

	const localMap = new Map(localTasks.map((task) => [task.id, task]));
	const summary = {
		total: remoteTasks.length,
		upserted: 0,
		keptLocal: 0,
		purgedLocally: 0,
	};

	for (const remoteTask of remoteTasks) {
		const localTask = localMap.get(remoteTask.id);
		const normalizedRemote = remoteToLocalTask(remoteTask, userId);
		const winner = chooseWinner(localTask, normalizedRemote, pendingTaskIds);

		if (localTask && winner === localTask) {
			summary.keptLocal += 1;
			continue;
		}

		await applySyncedRemoteTask(userId, remoteTask);
		summary.upserted += 1;
	}

	// Full pulls only: purge local rows that no longer exist remotely and have
	// no pending outbound changes. This mirrors hard deletes from other clients.
	if (!updatedAfter) {
		const remoteIds = new Set(remoteTasks.map((task) => task.id));

		for (const localTask of localTasks) {
			if (remoteIds.has(localTask.id)) {
				continue;
			}

			if (hasUnsyncedLocalChanges(localTask, pendingTaskIds)) {
				continue;
			}

			await hardDeleteTask(localTask.user_id, localTask.id);
			summary.purgedLocally += 1;
		}
	}

	await updateLastPulledAt(userId, nowIso());
	await updateLastSuccessfulSyncAt(userId, nowIso());

	return summary;
}

export async function syncAll({ userId, deviceId }) {
	if (!userId) {
		throw new Error("userId is required for sync.");
	}

	if (deviceId) {
		await initializeSyncState(userId, deviceId);
	}

	const syncState = await getSyncState(userId);
	const lastPulledAt = syncState?.last_pulled_at ?? null;

	// Always push local changes before pulling remote updates.
	const pushSummary = await pushPendingOperations(userId);
	const pullSummary = await pullRemoteTasks(userId, lastPulledAt);

	return {
		success: true,
		message: "Sync completed successfully.",
		data: {
			pushed: pushSummary,
			pulled: pullSummary,
		},
	};
}

let activeSyncPromise = null;

export async function syncNowIfPossible({ userId, deviceId }) {
	if (!userId) {
		return {
			success: false,
			message: "userId is required for sync.",
		};
	}

	if (activeSyncPromise) {
		return activeSyncPromise;
	}

	activeSyncPromise = (async () => {
		try {
			return await syncAll({ userId, deviceId });
		} catch (error) {
			return {
				success: false,
				message: error?.message || "Sync failed.",
			};
		} finally {
			activeSyncPromise = null;
		}
	})();

	return activeSyncPromise;
}
