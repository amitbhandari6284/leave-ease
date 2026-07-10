import mongoose from "mongoose";

import Notification from "./notification.model.js";

import { NOTIFICATION_TYPE_VALUES } from "../../constants/notificationTypes.js";
import { AppError } from "../../utils/AppError.js";

export async function getMyNotifications(req, res, next) {
  try {
    const { isRead, type, page = "1", limit = "10" } = req.query;
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1)
      throw new AppError("Page must be a positive integer", 400, "INVALID_PAGINATION_PAGE");
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50)
      throw new AppError("Limit must be between 1 and 50", 400, "INVALID_PAGINATION_LIMIT");

    const filter = {
      recipient: req.user._id,
    };
    if (isRead !== undefined) {
      if (isRead !== "true" && isRead !== "false")
        throw new AppError("isRead must be true or false", 400, "INVALID_BOOLEAN_VALUE");

      filter.isRead = isRead === "true";
    }

    let normalizedType = null;
    if (type) {
      normalizedType = String(type).trim().toUpperCase();
      if (!NOTIFICATION_TYPE_VALUES.includes(normalizedType))
        throw new AppError(`Type must be one of: ${NOTIFICATION_TYPE_VALUES.join(", ")}`, 400, "INVALID_NOTIFICATION_TYPE");

      filter.type = normalizedType;
    }
    const skip = (parsedPage - 1) * parsedLimit;

    // Already parallelized — list, total count, and unread count don't
    // depend on each other, so they run concurrently.
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
    if (!mongoose.isValidObjectId(notificationId)) throw new AppError("Invalid notification ID", 400, "INVALID_IDENTIFIER");
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });
    if (!notification) throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
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
