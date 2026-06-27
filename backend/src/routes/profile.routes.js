import { Router } from "express";
import {
	getMyProfile,
	updateMyProfile,
} from "../controllers/profile.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

export default router;
