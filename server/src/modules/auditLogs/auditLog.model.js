import mongoose from "mongoose";

import { AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES } from "../../constants/audit.js";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorRole: {
      type: String,
      trim: true,
      default: "SYSTEM",
    },

    action: {
      type: String,
      required: [true, "Audit action is required"],
      enum: {
        values: AUDIT_ACTION_VALUES,
        message: "Invalid audit action: {VALUE}",
      },
    },

    entityType: {
      type: String,
      required: [true, "Audit entity type is required"],
      enum: {
        values: AUDIT_ENTITY_TYPE_VALUES,
        message: "Invalid audit entity type: {VALUE}",
      },
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      required: [true, "Audit description is required"],
      trim: true,
      minLength: [3, "Audit description must contain at least 3 characters"],
      maxLength: [500, "Audit description cannot exceed 500 characters"],
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    success: {
      type: Boolean,
      default: true,
    },

    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },

    userAgent: {
      type: String,
      trim: true,
      maxLength: [500, "User agent cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },

    toJSON: {
      transform(document, returnedObject) {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

auditLogSchema.index({
  createdAt: -1,
});

auditLogSchema.index({
  actor: 1,
  createdAt: -1,
});

auditLogSchema.index({
  action: 1,
  createdAt: -1,
});

auditLogSchema.index({
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
