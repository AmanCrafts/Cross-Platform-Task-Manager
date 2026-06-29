import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { truncateLocalDb } from "../offline/db";
import { isOnline } from "../offline/network.monitor";
import { enqueueOperation } from "../offline/queue.repository";
import { syncNowIfPossible } from "../offline/sync.engine";
import { getSyncState } from "../offline/sync.repository";
import {
	getAllTasks,
	getTaskById,
	restoreTask as restoreLocalTask,
	softDeleteTask,
	updateTask as updateLocalTask,
	upsertTask,
} from "../offline/task.repository";
import { TaskRemoteService } from "./task.remote.service";

function nowIso() {
	return new Date().toISOString();
}

// Generates a plain RFC-4122 UUID suitable for postgres `uuid` columns.
function generateUUID() {
	return Crypto.randomUUID();
}

// Generates a prefixed ID for internal records (queue ops, idempotency keys)
// that are NOT stored in uuid columns.
function generatePrefixedId(prefix = "id") {
	return `${prefix}_${Crypto.randomUUID()}`;
}

function cleanString(value) {
	if (typeof value !== "string") return undefined;

	const trimmed = value.trim();
	return trimmed.length ? trimmed : undefined;
}

function cleanNullableString(value) {
	if (value === undefined) return undefined;
	if (value === null) return null;
	if (typeof value !== "string") return value;

	const trimmed = value.trim();
	return trimmed.length ? trimmed : null;
}

function cleanDate(value) {
	if (value === undefined) return undefined;
	if (value === null) return null;
	if (value instanceof Date) return value.toISOString();
	return value;
}

function stripUndefined(obj) {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	);
}

function normalizePayload(payload = {}) {
	return stripUndefined({
		title: cleanString(payload.title),
		description: cleanNullableString(payload.description),
		status: payload.status,
		priority: payload.priority,
		due_at: cleanDate(payload.due_at),
		reminder_at: cleanDate(payload.reminder_at),
		completed_at: cleanDate(payload.completed_at),
		sort_order: payload.sort_order,
		is_pinned: payload.is_pinned,
		is_recurring: payload.is_recurring,
		recurrence_rule: cleanNullableString(payload.recurrence_rule),
		metadata: payload.metadata,
		deleted_at: cleanDate(payload.deleted_at),
		archived_at: cleanDate(payload.archived_at),
		last_synced_at: cleanDate(payload.last_synced_at),
		client_timestamp: cleanDate(payload.client_timestamp),
	});
}

function taskPayloadForQueue(payload = {}) {
	return stripUndefined({
		title: cleanString(payload.title),
		description: cleanNullableString(payload.description),
		status: payload.status,
		priority: payload.priority,
		due_at: cleanDate(payload.due_at),
		reminder_at: cleanDate(payload.reminder_at),
		completed_at: cleanDate(payload.completed_at),
		sort_order: payload.sort_order,
		is_pinned: payload.is_pinned,
		is_recurring: payload.is_recurring,
		recurrence_rule: cleanNullableString(payload.recurrence_rule),
		metadata: payload.metadata,
		deleted_at: cleanDate(payload.deleted_at),
		archived_at: cleanDate(payload.archived_at),
	});
}

async function getCurrentUserId() {
	const { data, error } = await supabase.auth.getSession();

	if (error) {
		throw error;
	}

	const userId = data?.session?.user?.id;

	if (!userId) {
		throw new Error("No authenticated user found.");
	}

	return userId;
}

async function withUser(handler) {
	try {
		const userId = await getCurrentUserId();
		return await handler(userId);
	} catch (error) {
		return {
			success: false,
			message: error?.message || "Something went wrong.",
		};
	}
}

async function queueOperation({ userId, taskId, operation, payload = {} }) {
	await enqueueOperation({
		id: generatePrefixedId("op"),
		userId,
		taskId,
		operation,
		payload,
		status: "pending",
		attempts: 0,
		idempotencyKey: generatePrefixedId("idem"),
	});
}

async function syncIfOnline(userId) {
	if (!(await isOnline())) {
		return null;
	}

	const syncState = await getSyncState(userId);

	return syncNowIfPossible({
		userId,
		deviceId: syncState?.device_id ?? null,
	});
}

export const _nativeTaskService = {
	async getAll({ status = null, includeDeleted = false } = {}) {
		return withUser(async (userId) => {
			const data = await getAllTasks({
				userId,
				includeDeleted,
				status,
			});

			return {
				success: true,
				data,
				message: "Tasks loaded successfully.",
			};
		});
	},

	async getById(id) {
		return withUser(async (userId) => {
			const task = await getTaskById(userId, id, {
				includeDeleted: true,
			});

			if (!task) {
				return {
					success: false,
					message: "Task not found.",
				};
			}

			return {
				success: true,
				data: task,
				message: "Task loaded successfully.",
			};
		});
	},

	async create(payload) {
		return withUser(async (userId) => {
			const normalized = normalizePayload(payload);

			if (!normalized.title) {
				return {
					success: false,
					message: "Title is required.",
				};
			}

			const taskId = payload.id || generateUUID();
			const timestamp = nowIso();

			const localTask = {
				id: taskId,
				user_id: userId,
				title: normalized.title,
				description: normalized.description ?? null,
				status: normalized.status ?? "todo",
				priority: normalized.priority ?? "medium",
				due_at: normalized.due_at ?? null,
				reminder_at: normalized.reminder_at ?? null,
				completed_at: normalized.completed_at ?? null,
				sort_order: normalized.sort_order ?? 0,
				is_pinned: !!normalized.is_pinned,
				is_recurring: !!normalized.is_recurring,
				recurrence_rule: normalized.recurrence_rule ?? null,
				metadata: normalized.metadata ?? {},
				sync_version: 1,
				last_synced_at: null,
				last_modified_by: userId,
				deleted_at: null,
				archived_at: null,
				sync_status: "pending",
				is_dirty: true,
				local_updated_at: timestamp,
				created_at: timestamp,
				updated_at: timestamp,
			};

			const saved = await upsertTask(localTask);

			await queueOperation({
				userId,
				taskId,
				operation: "create",
				payload: taskPayloadForQueue(normalized),
			});

			await syncIfOnline(userId);

			const latest = await getTaskById(userId, taskId);

			return {
				success: true,
				data: latest ?? saved,
				message: "Task saved successfully.",
			};
		});
	},

	async update(id, payload) {
		return withUser(async (userId) => {
			const existing = await getTaskById(userId, id, {
				includeDeleted: true,
			});

			if (!existing) {
				return {
					success: false,
					message: "Task not found.",
				};
			}

			const normalized = normalizePayload(payload);

			const nextTask = await updateLocalTask(userId, id, {
				...normalized,
				is_dirty: true,
				sync_status: "pending",
				last_modified_by: userId,
				updated_at: nowIso(),
				local_updated_at: nowIso(),
			});

			await queueOperation({
				userId,
				taskId: id,
				operation: "update",
				payload: taskPayloadForQueue(normalized),
			});

			await syncIfOnline(userId);

			const latest = await getTaskById(userId, id);

			return {
				success: true,
				data: latest ?? nextTask,
				message: "Task updated successfully.",
			};
		});
	},

	async remove(id) {
		return withUser(async (userId) => {
			const existing = await getTaskById(userId, id, {
				includeDeleted: true,
			});

			if (!existing) {
				return {
					success: false,
					message: "Task not found.",
				};
			}

			const deletedTask = await softDeleteTask(userId, id);

			await queueOperation({
				userId,
				taskId: id,
				operation: "delete",
				payload: {},
			});

			await syncIfOnline(userId);

			return {
				success: true,
				data: deletedTask,
				message: "Task deleted.",
			};
		});
	},

	async restore(id) {
		return withUser(async (userId) => {
			const existing = await getTaskById(userId, id, {
				includeDeleted: true,
			});

			if (!existing) {
				return {
					success: false,
					message: "Task not found.",
				};
			}

			const restoredTask = await restoreLocalTask(userId, id);

			await queueOperation({
				userId,
				taskId: id,
				operation: "restore",
				payload: {
					deleted_at: null,
					archived_at: null,
				},
			});

			await syncIfOnline(userId);

			const latest = await getTaskById(userId, id);

			return {
				success: true,
				data: latest ?? restoredTask,
				message: "Task restored successfully.",
			};
		});
	},

	async sync() {
		return withUser(async (userId) => {
			const syncState = await getSyncState(userId);

			const result = await syncNowIfPossible({
				userId,
				deviceId: syncState?.device_id ?? null,
			});

			return result;
		});
	},

	async clearLocalCache() {
		return withUser(async (userId) => {
			await truncateLocalDb();

			return {
				success: true,
				message: "Local database truncated.",
				data: { userId },
			};
		});
	},
};

// On web, the offline SQLite cache is unavailable (expo-sqlite has no
// working web implementation in SDK 56). The remote service talks
// directly to the backend, which is what we want on web anyway.
function buildWebTaskService() {
	return {
		getAll: (opts) => TaskRemoteService.getAll(opts),
		getById: (id) => TaskRemoteService.getById(id),
		create: (payload) => TaskRemoteService.create(payload),
		update: (id, payload) => TaskRemoteService.update(id, payload),
		remove: (id) => TaskRemoteService.remove(id),
		restore: (id) => TaskRemoteService.restore(id),
		sync: () =>
			Promise.resolve({ success: true, message: "Web is always online." }),
		clearLocalCache: () =>
			Promise.resolve({
				success: true,
				message: "No local cache on web.",
			}),
	};
}

export const TaskService =
	Platform.OS === "web" ? buildWebTaskService() : _nativeTaskService;
