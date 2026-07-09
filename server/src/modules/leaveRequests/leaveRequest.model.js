import mongoose from "mongoose";

import { LEAVE_STATUSES, LEAVE_STATUS_VALUES } from "../../constants/leaveStatuses.js";

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee is required"],
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: [true, "Leave type is required"],
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    workingDays: {
      type: Number,
      required: [true, "Working-day count is required"],
      min: [1, "A leave request must contain at least one working day"],
    },

    reason: {
      type: String,
      required: [true, "Leave reason is required"],
      trim: true,
      minLength: [10, "Leave reason must contain at least 10 characters"],
      maxLength: [500, "Leave reason cannot exceed 500 characters"],
    },

    attachmentUrl: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: LEAVE_STATUS_VALUES,
        message: "Invalid leave request status: {VALUE}",
      },
      default: LEAVE_STATUSES.PENDING,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },

    decisionRemark: {
      type: String,
      trim: true,
      maxLength: [500, "Decision remark cannot exceed 500 characters"],
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxLength: [300, "Cancellation reason cannot exceed 300 characters"],
      default: "",
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
leaveRequestSchema.pre("validate", function validateDateRange() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be earlier than start date");
  }
});

leaveRequestSchema.index({
  employee: 1,
  createdAt: -1,
});

leaveRequestSchema.index({
  employee: 1,
  status: 1,
  startDate: 1,
  endDate: 1,
});

leaveRequestSchema.index({
  department: 1,
  status: 1,
  createdAt: 1,
});

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
