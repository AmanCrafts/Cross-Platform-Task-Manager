import {
	createTask,
	deleteTask,
	getTaskById,
	listTasks,
	restoreTask,
	syncBatch,
	updateTask,
} from "../services/task.service.js";

function getMeta(req) {
	return {
		deviceId: req.headers["x-device-id"] ?? null,
		idempotencyKey: req.headers["x-idempotency-key"] ?? null,
		requestId: req.headers["x-request-id"] ?? null,
		clientTimestamp: req.body?.client_timestamp ?? null,
		lastSyncedAt: req.body?.last_synced_at ?? null,
	};
}

export async function listUserTasks(req, res, next) {
	try {
		const status = req.query.status ?? null;
		const includeDeleted = req.query.include_deleted === "true";

		const tasks = await listTasks(req.user.id, {
			status,
			includeDeleted,
		});

		res.json({
			success: true,
			message: "Tasks fetched successfully.",
			data: tasks,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTask(req, res, next) {
	try {
		const task = await getTaskById(req.user.id, req.params.id);

		res.json({
			success: true,
			message: "Task fetched successfully.",
			data: task,
		});
	} catch (error) {
		next(error);
	}
}

export async function createNewTask(req, res, next) {
	try {
		const task = await createTask(req.user.id, req.body, getMeta(req));

		res.status(201).json({
			success: true,
			message: "Task created successfully.",
			data: task,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateExistingTask(req, res, next) {
	try {
		const task = await updateTask(
			req.user.id,
			req.params.id,
			req.body,
			getMeta(req),
		);

		res.json({
			success: true,
			message: "Task updated successfully.",
			data: task,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteExistingTask(req, res, next) {
	try {
		const task = await deleteTask(req.user.id, req.params.id, getMeta(req));

		res.json({
			success: true,
			message: "Task deleted successfully.",
			data: task,
		});
	} catch (error) {
		next(error);
	}
}

export async function restoreExistingTask(req, res, next) {
	try {
		const task = await restoreTask(req.user.id, req.params.id, getMeta(req));

		res.json({
			success: true,
			message: "Task restored successfully.",
			data: task,
		});
	} catch (error) {
		next(error);
	}
}

export async function syncTasks(req, res, next) {
	try {
		const operations = Array.isArray(req.body.operations)
			? req.body.operations
			: [];

		const result = await syncBatch(req.user.id, operations, getMeta(req));

		res.json({
			success: true,
			message: "Sync completed.",
			data: result,
		});
	} catch (error) {
		next(error);
	}
}
