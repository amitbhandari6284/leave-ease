import mongoose from "mongoose";

import Notification from "./notification.model.js";

import { NOTIFICATION_TYPE_VALUES } from "../../constants/notificationTypes.js";

export async function getMyNotifications(req, res, next) {
  try {
    const { isRead, type, page = "1", limit = "10" } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
    }

    const filter = {
      recipient: req.user._id,
    };

    if (isRead !== undefined) {
      if (isRead !== "true" && isRead !== "false") {
        return res.status(400).json({
          success: false,
          message: "isRead must be true or false",
        });
      }

      filter.isRead = isRead === "true";
    }

    let normalizedType = null;

    if (type) {
      normalizedType = String(type).trim().toUpperCase();

      if (!NOTIFICATION_TYPE_VALUES.includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: `Type must be one of: ${NOTIFICATION_TYPE_VALUES.join(", ")}`,
        });
      }

      filter.type = normalizedType;
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    const totalPages = Math.ceil(totalNotifications / parsedLimit);

    return res.status(200).json({
      success: true,

      filters: {
        isRead: isRead === undefined ? null : isRead === "true",
        type: normalizedType,
      },

      unreadCount,
      count: notifications.length,
      notifications,

      pagination: {
        currentPage: parsedPage,
        limit: parsedLimit,
        totalNotifications,
        totalPages,
        hasPreviousPage: parsedPage > 1,
        hasNextPage: parsedPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadNotificationCount(req, res, next) {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const wasAlreadyRead = notification.isRead;

    if (!wasAlreadyRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: wasAlreadyRead ? "Notification is already read" : "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const readAt = new Date();

    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: result.modifiedCount > 0 ? "All notifications marked as read" : "There are no unread notifications",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}
