import { db } from "../config/db.js";

export async function createSyncLog({
	userId,
	taskId = null,
	operation,
	status = "synced",
	payload = {},
	previousState = null,
	newState = null,
	conflictReason = null,
	errorMessage = null,
	deviceId = null,
	idempotencyKey = null,
	requestId = null,
	clientTimestamp = null,
}) {
	const { data, error } = await db
		.from("task_sync_logs")
		.insert({
			user_id: userId,
			task_id: taskId,
			operation,
			status,
			device_id: deviceId,
			idempotency_key: idempotencyKey,
			client_timestamp: clientTimestamp,
			server_timestamp: new Date().toISOString(),
			processed_at: new Date().toISOString(),
			payload,
			previous_state: previousState,
			new_state: newState,
			conflict_reason: conflictReason,
			error_message: errorMessage,
			request_id: requestId,
		})
		.select()
		.single();

	if (error) {
		console.error("Failed to create sync log:", error.message);
		return null;
	}

	return data;
}
