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

function rowToOperation(row) {
	if (!row) return null;

	return {
		id: row.id,
		user_id: row.user_id,
		task_id: row.task_id,
		operation: row.operation,
		payload: safeJsonParse(row.payload_json, {}),
		status: row.status,
		attempts: row.attempts ?? 0,
		idempotency_key: row.idempotency_key ?? null,
		error_message: row.error_message ?? null,
		created_at: row.created_at,
		updated_at: row.updated_at,
		last_attempt_at: row.last_attempt_at ?? null,
		synced_at: row.synced_at ?? null,
	};
}

export async function enqueueOperation({
	id,
	userId,
	taskId,
	operation,
	payload = {},
	status = "pending",
	attempts = 0,
	idempotencyKey = null,
	errorMessage = null,
	lastAttemptAt = null,
	syncedAt = null,
}) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		INSERT INTO pending_operations (
			id,
			user_id,
			task_id,
			operation,
			payload_json,
			status,
			attempts,
			idempotency_key,
			error_message,
			created_at,
			updated_at,
			last_attempt_at,
			synced_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			user_id = excluded.user_id,
			task_id = excluded.task_id,
			operation = excluded.operation,
			payload_json = excluded.payload_json,
			status = excluded.status,
			attempts = excluded.attempts,
			idempotency_key = excluded.idempotency_key,
			error_message = excluded.error_message,
			updated_at = excluded.updated_at,
			last_attempt_at = excluded.last_attempt_at,
			synced_at = excluded.synced_at
		`,
		[
			id,
			userId,
			taskId,
			operation,
			JSON.stringify(payload ?? {}),
			status,
			attempts,
			idempotencyKey,
			errorMessage,
			timestamp,
			timestamp,
			lastAttemptAt,
			syncedAt,
		],
	);

	return await getOperationById(id);
}

export async function getPendingTaskIds(userId) {
	const db = await getOfflineDb();

	const rows = await db.getAllAsync(
		`
		SELECT DISTINCT task_id
		FROM pending_operations
		WHERE user_id = ?
		  AND status IN ('pending', 'failed', 'syncing')
		`,
		[userId],
	);

	return new Set(rows.map((row) => row.task_id));
}

export async function getPendingOperations(userId) {
	const db = await getOfflineDb();

	const rows = await db.getAllAsync(
		`
		SELECT *
		FROM pending_operations
		WHERE user_id = ?
		  AND status IN ('pending', 'failed')
		ORDER BY created_at ASC
		`,
		[userId],
	);

	return rows.map(rowToOperation);
}

export async function getOperationById(id) {
	const db = await getOfflineDb();
	const row = await db.getFirstAsync(
		`SELECT * FROM pending_operations WHERE id = ? LIMIT 1`,
		[id],
	);

	return rowToOperation(row);
}

export async function markOperationSyncing(id) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE pending_operations
		SET status = 'syncing',
			attempts = attempts + 1,
			last_attempt_at = ?,
			updated_at = ?
		WHERE id = ?
		`,
		[timestamp, timestamp, id],
	);

	return await getOperationById(id);
}

export async function markOperationSynced(id) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE pending_operations
		SET status = 'synced',
			synced_at = ?,
			updated_at = ?
		WHERE id = ?
		`,
		[timestamp, timestamp, id],
	);

	return await getOperationById(id);
}

export async function markOperationFailed(id, errorMessage = null) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE pending_operations
		SET status = 'failed',
			error_message = ?,
			updated_at = ?
		WHERE id = ?
		`,
		[errorMessage, timestamp, id],
	);

	return await getOperationById(id);
}

export async function removeOperation(id) {
	const db = await getOfflineDb();
	await db.runAsync(`DELETE FROM pending_operations WHERE id = ?`, [id]);
}

export async function clearOperations(userId) {
	const db = await getOfflineDb();
	await db.runAsync(`DELETE FROM pending_operations WHERE user_id = ?`, [
		userId,
	]);
}

export async function clearSyncedOperations(userId) {
	const db = await getOfflineDb();
	await db.runAsync(
		`DELETE FROM pending_operations WHERE user_id = ? AND status = 'synced'`,
		[userId],
	);
}
