import express from "express";
import {
	getNotifications,
	markNotificationsRead,
} from "../controllers/notification.js";

const router = express.Router();

router.get("/", getNotifications);
router.put("/read", markNotificationsRead);

export default router;
