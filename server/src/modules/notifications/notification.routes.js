import express from "express";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/unread-count", getUnreadNotificationCount);

router.patch("/read-all", markAllNotificationsAsRead);

router.patch("/:notificationId/read", markNotificationAsRead);

router.get("/", getMyNotifications);

export default router;
