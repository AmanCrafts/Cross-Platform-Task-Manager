import { db } from "../config/db.js";
import { createSyncLog } from "./sync-log.service.js";

function buildTaskQuery(userId, options = {}) {
	const { includeDeleted = false, status = null } = options;

	let query = db
		.from("tasks")
		.select("*")
		.eq("user_id", userId)
		.order("sort_order", { ascending: true })
		.order("updated_at", { ascending: false });

	if (!includeDeleted) {
		query = query.is("deleted_at", null);
	}

	if (status) {
		query = query.eq("status", status);
	}

	return query;
}

export async function listTasks(userId, options = {}) {
	const { data, error } = await buildTaskQuery(userId, options);

	if (error) throw error;

	return data || [];
}

export async function getTaskById(userId, taskId, options = {}) {
	const { includeDeleted = false } = options;

	let query = db
		.from("tasks")
		.select("*")
		.eq("id", taskId)
		.eq("user_id", userId);

	if (!includeDeleted) {
		query = query.is("deleted_at", null);
	}

	const { data, error } = await query.single();

	if (error) throw error;

	return data;
}

export async function createTask(userId, payload, meta = {}) {
	if (!payload?.title?.trim()) {
		const error = new Error("Title is required");
		error.statusCode = 400;
		throw error;
	}

	const taskPayload = {
		user_id: userId,
		title: payload.title.trim(),
		description: payload.description ?? null,
		status: payload.status ?? "todo",
		priority: payload.priority ?? "medium",
		due_at: payload.due_at ?? null,
		reminder_at: payload.reminder_at ?? null,
		completed_at: payload.completed_at ?? null,
		sort_order: payload.sort_order ?? 0,
		is_pinned: payload.is_pinned ?? false,
		is_recurring: payload.is_recurring ?? false,
		recurrence_rule: payload.recurrence_rule ?? null,
		metadata: payload.metadata ?? {},
		last_synced_at: meta.lastSyncedAt ?? null,
		last_modified_by: userId,
	};

	const { data, error } = await db
		.from("tasks")
		.insert(taskPayload)
		.select()
		.single();

	if (error) throw error;

	await createSyncLog({
		userId,
		taskId: data.id,
		operation: "create",
		status: "synced",
		payload: taskPayload,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
		clientTimestamp: meta.clientTimestamp ?? null,
	});

	return data;
}

export async function updateTask(userId, taskId, payload, meta = {}) {
	const existingTask = await getTaskById(userId, taskId, {
		includeDeleted: true,
	});

	const nextTask = {
		title:
			payload.title !== undefined ? payload.title.trim() : existingTask.title,
		description:
			payload.description !== undefined
				? payload.description
				: existingTask.description,
		status: payload.status ?? existingTask.status,
		priority: payload.priority ?? existingTask.priority,
		due_at: payload.due_at !== undefined ? payload.due_at : existingTask.due_at,
		reminder_at:
			payload.reminder_at !== undefined
				? payload.reminder_at
				: existingTask.reminder_at,
		completed_at:
			payload.completed_at !== undefined
				? payload.completed_at
				: existingTask.completed_at,
		sort_order:
			payload.sort_order !== undefined
				? payload.sort_order
				: existingTask.sort_order,
		is_pinned:
			payload.is_pinned !== undefined
				? payload.is_pinned
				: existingTask.is_pinned,
		is_recurring:
			payload.is_recurring !== undefined
				? payload.is_recurring
				: existingTask.is_recurring,
		recurrence_rule:
			payload.recurrence_rule !== undefined
				? payload.recurrence_rule
				: existingTask.recurrence_rule,
		metadata:
			payload.metadata !== undefined ? payload.metadata : existingTask.metadata,
		deleted_at:
			payload.deleted_at !== undefined
				? payload.deleted_at
				: existingTask.deleted_at,
		archived_at:
			payload.archived_at !== undefined
				? payload.archived_at
				: existingTask.archived_at,
		sync_version: (existingTask.sync_version ?? 1) + 1,
		last_synced_at: meta.lastSyncedAt ?? existingTask.last_synced_at,
		last_modified_by: userId,
		updated_at: new Date().toISOString(),
	};

	if (!nextTask.title?.trim()) {
		const error = new Error("Title is required");
		error.statusCode = 400;
		throw error;
	}

	const { data, error } = await db
		.from("tasks")
		.update(nextTask)
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw error;

	await createSyncLog({
		userId,
		taskId,
		operation: "update",
		status: "synced",
		payload,
		previousState: existingTask,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
		clientTimestamp: meta.clientTimestamp ?? null,
	});

	return data;
}

export async function deleteTask(userId, taskId, meta = {}) {
	const existingTask = await getTaskById(userId, taskId, {
		includeDeleted: true,
	});

	const now = new Date().toISOString();

	const { data, error } = await db
		.from("tasks")
		.update({
			deleted_at: now,
			archived_at: existingTask.archived_at ?? null,
			sync_version: (existingTask.sync_version ?? 1) + 1,
			last_synced_at: meta.lastSyncedAt ?? existingTask.last_synced_at,
			last_modified_by: userId,
			updated_at: now,
		})
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw error;

	await createSyncLog({
		userId,
		taskId,
		operation: "delete",
		status: "synced",
		payload: { deleted_at: now },
		previousState: existingTask,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
		clientTimestamp: meta.clientTimestamp ?? null,
	});

	return data;
}

export async function restoreTask(userId, taskId, meta = {}) {
	const existingTask = await getTaskById(userId, taskId, {
		includeDeleted: true,
	});

	const now = new Date().toISOString();

	const { data, error } = await db
		.from("tasks")
		.update({
			deleted_at: null,
			archived_at: null,
			sync_version: (existingTask.sync_version ?? 1) + 1,
			last_synced_at: meta.lastSyncedAt ?? existingTask.last_synced_at,
			last_modified_by: userId,
			updated_at: now,
		})
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw error;

	await createSyncLog({
		userId,
		taskId,
		operation: "restore",
		status: "synced",
		payload: {},
		previousState: existingTask,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
		clientTimestamp: meta.clientTimestamp ?? null,
	});

	return data;
}

export async function syncBatch(userId, operations = [], meta = {}) {
	const results = [];

	for (const op of operations) {
		try {
			let result = null;

			if (op.operation === "create") {
				result = await createTask(userId, op.payload ?? {}, meta);
			} else if (op.operation === "update") {
				result = await updateTask(userId, op.taskId, op.payload ?? {}, meta);
			} else if (op.operation === "delete") {
				result = await deleteTask(userId, op.taskId, meta);
			} else if (op.operation === "restore") {
				result = await restoreTask(userId, op.taskId, meta);
			} else {
				throw new Error(`Unsupported operation: ${op.operation}`);
			}

			results.push({
				operation: op.operation,
				taskId: op.taskId ?? result?.id ?? null,
				success: true,
				data: result,
			});
		} catch (error) {
			results.push({
				operation: op.operation,
				taskId: op.taskId ?? null,
				success: false,
				message: error.message,
			});
		}
	}

	return results;
}
