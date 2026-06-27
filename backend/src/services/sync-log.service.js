import { db } from "../config/db.js";

export async function createSyncLog({
	userId,
	taskId,
	operation,
	status = "synced",
	payload = {},
	previousState = null,
	newState = null,
	conflictReason = null,
	errorMessage = null,
	deviceId = null,
	idempotencyKey = null,
}) {
	const { error } = await db.from("task_sync_logs").insert({
		user_id: userId,
		task_id: taskId,
		operation,
		status,
		payload,
		previous_state: previousState,
		new_state: newState,
		conflict_reason: conflictReason,
		error_message: errorMessage,
		device_id: deviceId,
		idempotency_key: idempotencyKey,
		client_timestamp: new Date().toISOString(),
		server_timestamp: new Date().toISOString(),
		processed_at: new Date().toISOString(),
	});

	if (error) {
		console.error(error);
	}
}
