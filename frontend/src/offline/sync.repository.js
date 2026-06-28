import { getOfflineDb } from "./db.js";

function nowIso() {
	return new Date().toISOString();
}

export async function getSyncState(userId) {
	const db = await getOfflineDb();

	const row = await db.getFirstAsync(
		`SELECT * FROM sync_meta WHERE user_id = ? LIMIT 1`,
		[userId],
	);

	if (!row) return null;

	return {
		user_id: row.user_id,
		device_id: row.device_id,
		last_successful_sync_at: row.last_successful_sync_at ?? null,
		last_pulled_at: row.last_pulled_at ?? null,
		last_pushed_at: row.last_pushed_at ?? null,
		updated_at: row.updated_at,
	};
}

export async function initializeSyncState(userId, deviceId) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		INSERT INTO sync_meta (
			user_id,
			device_id,
			last_successful_sync_at,
			last_pulled_at,
			last_pushed_at,
			updated_at
		) VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			device_id = excluded.device_id,
			updated_at = excluded.updated_at
		`,
		[userId, deviceId, null, null, null, timestamp],
	);

	return await getSyncState(userId);
}

export async function updateLastPulledAt(userId, value = nowIso()) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE sync_meta
		SET last_pulled_at = ?,
			updated_at = ?
		WHERE user_id = ?
		`,
		[value, timestamp, userId],
	);

	return await getSyncState(userId);
}

export async function updateLastPushedAt(userId, value = nowIso()) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE sync_meta
		SET last_pushed_at = ?,
			updated_at = ?
		WHERE user_id = ?
		`,
		[value, timestamp, userId],
	);

	return await getSyncState(userId);
}

export async function updateLastSuccessfulSyncAt(userId, value = nowIso()) {
	const db = await getOfflineDb();
	const timestamp = nowIso();

	await db.runAsync(
		`
		UPDATE sync_meta
		SET last_successful_sync_at = ?,
			updated_at = ?
		WHERE user_id = ?
		`,
		[value, timestamp, userId],
	);

	return await getSyncState(userId);
}

export async function clearSyncState(userId) {
	const db = await getOfflineDb();
	await db.runAsync(`DELETE FROM sync_meta WHERE user_id = ?`, [userId]);
}
