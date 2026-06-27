import { db } from "../config/db.js";
import { createSyncLog } from "./sync-log.service.js";

function buildTaskQuery(userId, includeDeleted = false) {
	let query = db
		.from("tasks")
		.select("*")
		.eq("user_id", userId)
		.order("sort_order", { ascending: true })
		.order("updated_at", { ascending: false });

	if (!includeDeleted) {
		query = query.is("deleted_at", null);
	}

	return query;
}

export async function getTasks(userId, options = {}) {
	const { includeDeleted = false, status = null } = options;

	let query = buildTaskQuery(userId, includeDeleted);

	if (status) {
		query = query.eq("status", status);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return data || [];
}

export async function getTaskById(userId, taskId) {
	const { data, error } = await db
		.from("tasks")
		.select("*")
		.eq("id", taskId)
		.eq("user_id", userId)
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function createTask(userId, taskData, meta = {}) {
	const payload = {
		user_id: userId,
		title: taskData.title,
		description: taskData.description ?? null,
		status: taskData.status ?? "todo",
		priority: taskData.priority ?? "medium",
		due_at: taskData.due_at ?? null,
		reminder_at: taskData.reminder_at ?? null,
		completed_at: taskData.completed_at ?? null,
		sort_order: taskData.sort_order ?? 0,
		is_pinned: taskData.is_pinned ?? false,
		is_recurring: taskData.is_recurring ?? false,
		recurrence_rule: taskData.recurrence_rule ?? null,
		metadata: taskData.metadata ?? {},
	};

	const { data, error } = await db
		.from("tasks")
		.insert(payload)
		.select()
		.single();

	if (error) {
		throw error;
	}

	await createSyncLog({
		userId,
		taskId: data.id,
		operation: "create",
		status: "synced",
		payload,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
	});

	return data;
}

export async function updateTask(userId, taskId, updates, meta = {}) {
	const { data: existingTask, error: fetchError } = await db
		.from("tasks")
		.select("*")
		.eq("id", taskId)
		.eq("user_id", userId)
		.single();

	if (fetchError) {
		throw fetchError;
	}

	const payload = {
		title: updates.title ?? existingTask.title,
		description: updates.description ?? existingTask.description,
		status: updates.status ?? existingTask.status,
		priority: updates.priority ?? existingTask.priority,
		due_at: updates.due_at !== undefined ? updates.due_at : existingTask.due_at,
		reminder_at:
			updates.reminder_at !== undefined
				? updates.reminder_at
				: existingTask.reminder_at,
		completed_at:
			updates.completed_at !== undefined
				? updates.completed_at
				: existingTask.completed_at,
		sort_order:
			updates.sort_order !== undefined
				? updates.sort_order
				: existingTask.sort_order,
		is_pinned:
			updates.is_pinned !== undefined
				? updates.is_pinned
				: existingTask.is_pinned,
		is_recurring:
			updates.is_recurring !== undefined
				? updates.is_recurring
				: existingTask.is_recurring,
		recurrence_rule:
			updates.recurrence_rule !== undefined
				? updates.recurrence_rule
				: existingTask.recurrence_rule,
		metadata:
			updates.metadata !== undefined ? updates.metadata : existingTask.metadata,
		deleted_at:
			updates.deleted_at !== undefined
				? updates.deleted_at
				: existingTask.deleted_at,
		archived_at:
			updates.archived_at !== undefined
				? updates.archived_at
				: existingTask.archived_at,
	};

	const { data, error } = await db
		.from("tasks")
		.update(payload)
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) {
		throw error;
	}

	await createSyncLog({
		userId,
		taskId,
		operation: "update",
		status: "synced",
		payload: updates,
		previousState: existingTask,
		newState: data,
		deviceId: meta.deviceId ?? null,
		idempotencyKey: meta.idempotencyKey ?? null,
		requestId: meta.requestId ?? null,
	});

	return data;
}

export async function deleteTask(userId, taskId, meta = {}) {
	const { data: existingTask, error: fetchError } = await db
		.from("tasks")
		.select("*")
		.eq("id", taskId)
		.eq("user_id", userId)
		.single();

	if (fetchError) {
		throw fetchError;
	}

	const now = new Date().toISOString();

	const { data, error } = await db
		.from("tasks")
		.update({
			deleted_at: now,
			updated_at: now,
		})
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) {
		throw error;
	}

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
	});

	return data;
}

export async function restoreTask(userId, taskId, meta = {}) {
	const { data: existingTask, error: fetchError } = await db
		.from("tasks")
		.select("*")
		.eq("id", taskId)
		.eq("user_id", userId)
		.single();

	if (fetchError) {
		throw fetchError;
	}

	const now = new Date().toISOString();

	const { data, error } = await db
		.from("tasks")
		.update({
			deleted_at: null,
			archived_at: null,
			updated_at: now,
		})
		.eq("id", taskId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) {
		throw error;
	}

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
	});

	return data;
}
