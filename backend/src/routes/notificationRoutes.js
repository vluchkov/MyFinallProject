import express from "express";
import {
  createNotificationManually,
  getNotifications,
  markNotificationsAsRead,
  markSingleNotificationAsRead,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.post("/", verifyToken, createNotificationManually);
router.post("/mark-read", verifyToken, markNotificationsAsRead);
router.post(
  "/:notificationId/mark-read",
  verifyToken,
  markSingleNotificationAsRead
);

export default router;
