import client from "../api/client";
import { getApiErrorMessage } from "../utils/api-error";

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
	return value;
}

function stripUndefined(obj) {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	);
}

function normalizePayload(payload = {}) {
	return stripUndefined({
		id: payload.id,

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

async function safeRequest(requestFn) {
	try {
		const response = await requestFn();

		return {
			success: true,
			data: response.data?.data ?? response.data,
			message: response.data?.message ?? "Success",
		};
	} catch (error) {
		const apiError = getApiErrorMessage(error);

		return {
			success: false,
			...apiError,
		};
	}
}

export const TaskRemoteService = {
	async getAll({
		status = null,
		includeDeleted = false,
		updatedAfter = null,
	} = {}) {
		return safeRequest(() => {
			const params = {};

			if (status) {
				params.status = status;
			}

			if (includeDeleted) {
				params.include_deleted = true;
			}

			// Incremental pull: only fetch tasks modified after the last sync.
			// Falls back to a full pull when updatedAfter is null/undefined.
			if (updatedAfter) {
				params.updated_after = updatedAfter;
			}

			return client.get("/api/tasks", {
				params,
			});
		});
	},

	async getById(id) {
		return safeRequest(() => client.get(`/api/tasks/${id}`));
	},

	async create(payload) {
		return safeRequest(() =>
			client.post("/api/tasks", normalizePayload(payload)),
		);
	},

	async update(id, payload) {
		return safeRequest(() =>
			client.patch(`/api/tasks/${id}`, normalizePayload(payload)),
		);
	},

	async remove(id) {
		return safeRequest(() => client.delete(`/api/tasks/${id}`));
	},

	async restore(id) {
		return safeRequest(() => client.post(`/api/tasks/${id}/restore`));
	},

	async sync(operations = []) {
		return safeRequest(() =>
			client.post("/api/tasks/sync", {
				operations,
			}),
		);
	},
};
