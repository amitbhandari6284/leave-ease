import mongoose from "mongoose";

import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_VALUES } from "../../constants/notificationTypes.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
    },

    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPE_VALUES,
        message: "Invalid notification type: {VALUE}",
      },
      default: NOTIFICATION_TYPES.SYSTEM,
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      minLength: [2, "Notification title must contain at least 2 characters"],
      maxLength: [120, "Notification title cannot exceed 120 characters"],
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      minLength: [2, "Notification message must contain at least 2 characters"],
      maxLength: [500, "Notification message cannot exceed 500 characters"],
    },

    relatedLeaveRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      default: null,
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    relatedLeaveBalance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveBalance",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(document, returnedObject) {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
