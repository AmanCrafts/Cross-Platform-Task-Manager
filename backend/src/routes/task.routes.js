import { Router } from "express";
import {
	createNewTask,
	deleteExistingTask,
	getTask,
	listUserTasks,
	restoreExistingTask,
	syncTasks,
	updateExistingTask,
} from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listUserTasks);
router.get("/:id", getTask);
router.post("/", createNewTask);
router.patch("/:id", updateExistingTask);
router.delete("/:id", deleteExistingTask);
router.post("/:id/restore", restoreExistingTask);
router.post("/sync", syncTasks);

export default router;
