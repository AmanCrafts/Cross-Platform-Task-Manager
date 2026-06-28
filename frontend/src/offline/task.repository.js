import { getOfflineDb } from "./db.js";

function nowIso() {
	return new Date().toISOString();
}

function safeJsonParse(value, fallback = {}) {
	if (!value) return fallback;

	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function toInt(value) {
	return value ? 1 : 0;
}

function fromInt(value) {
	return value === 1 || value === true;
}

function rowToTask(row) {
	if (!row) return null;

	return {
		id: row.id,
		user_id: row.user_id,
		title: row.title,
		description: row.description ?? null,
		status: row.status,
		priority: row.priority,
		due_at: row.due_at ?? null,
		reminder_at: row.reminder_at ?? null,
		completed_at: row.completed_at ?? null,
		sort_order: row.sort_order ?? 0,
		is_pinned: fromInt(row.is_pinned),
		is_recurring: fromInt(row.is_recurring),
		recurrence_rule: row.recurrence_rule ?? null,
		metadata: safeJsonParse(row.metadata, {}),
		sync_version: row.sync_version ?? 1,
		last_synced_at: row.last_synced_at ?? null,
		last_modified_by: row.last_modified_by ?? null,
		deleted_at: row.deleted_at ?? null,
		archived_at: row.archived_at ?? null,
		sync_status: row.sync_status ?? "synced",
		is_dirty: fromInt(row.is_dirty),
		local_updated_at: row.local_updated_at ?? null,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

function taskToParams(task) {
	const timestamp = nowIso();

	return {
		$id: task.id,
		$user_id: task.user_id,
		$title: task.title,
		$description: task.description ?? null,
		$status: task.status ?? "todo",
		$priority: task.priority ?? "medium",
		$due_at: task.due_at ?? null,
		$reminder_at: task.reminder_at ?? null,
		$completed_at: task.completed_at ?? null,
		$sort_order: task.sort_order ?? 0,
		$is_pinned: toInt(task.is_pinned),
		$is_recurring: toInt(task.is_recurring),
		$recurrence_rule: task.recurrence_rule ?? null,
		$metadata: JSON.stringify(task.metadata ?? {}),
		$sync_version: task.sync_version ?? 1,
		$last_synced_at: task.last_synced_at ?? null,
		$last_modified_by: task.last_modified_by ?? null,
		$deleted_at: task.deleted_at ?? null,
		$archived_at: task.archived_at ?? null,
		$sync_status: task.sync_status ?? "synced",
		$is_dirty: toInt(task.is_dirty ?? false),
		$local_updated_at: task.local_updated_at ?? timestamp,
		$created_at: task.created_at ?? timestamp,
		$updated_at: task.updated_at ?? timestamp,
	};
}

export async function getAllTasks({
	userId,
	includeDeleted = false,
	status = null,
} = {}) {
	const db = await getOfflineDb();

	let sql = `
		SELECT *
		FROM tasks_local
		WHERE user_id = ?
	`;

	const params = [userId];

	if (!includeDeleted) {
		sql += ` AND deleted_at IS NULL`;
	}

	if (status) {
		sql += ` AND status = ?`;
		params.push(status);
	}

	sql += ` ORDER BY sort_order ASC, updated_at DESC`;

	const rows = await db.getAllAsync(sql, params);
	return rows.map(rowToTask);
}

export async function getTaskById(
	userId,
	taskId,
	{ includeDeleted = false } = {},
) {
	const db = await getOfflineDb();

	let sql = `
		SELECT *
		FROM tasks_local
		WHERE user_id = ? AND id = ?
	`;

	const params = [userId, taskId];

	if (!includeDeleted) {
		sql += ` AND deleted_at IS NULL`;
	}

	sql += ` LIMIT 1`;

	const row = await db.getFirstAsync(sql, params);
	return rowToTask(row);
}

export async function upsertTask(task) {
	const db = await getOfflineDb();
	const now = nowIso();

	const row = {
		...task,
		created_at: task.created_at ?? now,
		updated_at: task.updated_at ?? now,
		local_updated_at: task.local_updated_at ?? now,
	};

	await db.runAsync(
		`
		INSERT INTO tasks_local (
			id,
			user_id,
			title,
			description,
			status,
			priority,
			due_at,
			reminder_at,
			completed_at,
			sort_order,
			is_pinned,
			is_recurring,
			recurrence_rule,
			metadata,
			sync_version,
			last_synced_at,
			last_modified_by,
			deleted_at,
			archived_at,
			sync_status,
			is_dirty,
			local_updated_at,
			created_at,
			updated_at
		) VALUES (
			$id,
			$user_id,
			$title,
			$description,
			$status,
			$priority,
			$due_at,
			$reminder_at,
			$completed_at,
			$sort_order,
			$is_pinned,
			$is_recurring,
			$recurrence_rule,
			$metadata,
			$sync_version,
			$last_synced_at,
			$last_modified_by,
			$deleted_at,
			$archived_at,
			$sync_status,
			$is_dirty,
			$local_updated_at,
			$created_at,
			$updated_at
		)
		ON CONFLICT(id) DO UPDATE SET
			user_id = excluded.user_id,
			title = excluded.title,
			description = excluded.description,
			status = excluded.status,
			priority = excluded.priority,
			due_at = excluded.due_at,
			reminder_at = excluded.reminder_at,
			completed_at = excluded.completed_at,
			sort_order = excluded.sort_order,
			is_pinned = excluded.is_pinned,
			is_recurring = excluded.is_recurring,
			recurrence_rule = excluded.recurrence_rule,
			metadata = excluded.metadata,
			sync_version = excluded.sync_version,
			last_synced_at = excluded.last_synced_at,
			last_modified_by = excluded.last_modified_by,
			deleted_at = excluded.deleted_at,
			archived_at = excluded.archived_at,
			sync_status = excluded.sync_status,
			is_dirty = excluded.is_dirty,
			local_updated_at = excluded.local_updated_at,
			updated_at = excluded.updated_at
		`,
		taskToParams(row),
	);

	return await getTaskById(row.user_id, row.id, { includeDeleted: true });
}

export async function insertTask(task) {
	return upsertTask(task);
}

export async function updateTask(userId, taskId, updates) {
	const existing = await getTaskById(userId, taskId, { includeDeleted: true });

	if (!existing) return null;

	const next = {
		...existing,
		...updates,
		id: existing.id,
		user_id: existing.user_id,
		// Increment locally so conflict resolution has accurate version info.
		// The backend also increments on its side; whichever is higher wins.
		sync_version: (existing.sync_version ?? 1) + 1,
		updated_at: nowIso(),
		local_updated_at: nowIso(),
		is_dirty: true,
		sync_status: "pending",
	};

	return await upsertTask(next);
}

export async function hardDeleteTask(userId, taskId) {
	const db = await getOfflineDb();
	await db.runAsync(`DELETE FROM tasks_local WHERE user_id = ? AND id = ?`, [
		userId,
		taskId,
	]);
}

export async function softDeleteTask(userId, taskId) {
	const timestamp = nowIso();

	return updateTask(userId, taskId, {
		deleted_at: timestamp,
		updated_at: timestamp,
		local_updated_at: timestamp,
		is_dirty: true,
		sync_status: "pending",
	});
}

export async function restoreTask(userId, taskId) {
	return updateTask(userId, taskId, {
		deleted_at: null,
		archived_at: null,
		is_dirty: true,
		sync_status: "pending",
	});
}

export async function replaceAllTasks(userId, tasks = []) {
	const db = await getOfflineDb();

	await db.runAsync(`DELETE FROM tasks_local WHERE user_id = ?`, [userId]);

	for (const task of tasks) {
		await upsertTask({
			...task,
			user_id: userId,
			is_dirty: false,
			sync_status: "synced",
			local_updated_at: task.local_updated_at ?? nowIso(),
		});
	}

	return await getAllTasks({ userId, includeDeleted: true });
}

export async function clearTasks(userId) {
	const db = await getOfflineDb();
	await db.runAsync(`DELETE FROM tasks_local WHERE user_id = ?`, [userId]);
}

export async function countTasks(userId) {
	const db = await getOfflineDb();
	const row = await db.getFirstAsync(
		`SELECT COUNT(*) as count FROM tasks_local WHERE user_id = ?`,
		[userId],
	);

	return row?.count ?? 0;
}
