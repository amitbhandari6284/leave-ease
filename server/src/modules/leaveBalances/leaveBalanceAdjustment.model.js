import mongoose from "mongoose";

const leaveBalanceAdjustmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    leaveBalance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveBalance",
      required: [true, "Leave balance is required"],
    },

    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: [true, "Leave type is required"],
    },

    year: {
      type: Number,
      required: [true, "Balance year is required"],
      min: [2000, "Balance year must be at least 2000"],
      max: [2100, "Balance year cannot exceed 2100"],
    },

    amount: {
      type: Number,
      required: [true, "Adjustment amount is required"],
    },

    reason: {
      type: String,
      required: [true, "Adjustment reason is required"],
      trim: true,
      minLength: [10, "Adjustment reason must contain at least 10 characters"],
      maxLength: [500, "Adjustment reason cannot exceed 500 characters"],
    },

    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Balance adjuster is required"],
    },

    previousAdjustmentTotal: {
      type: Number,
      required: true,
    },

    newAdjustmentTotal: {
      type: Number,
      required: true,
    },

    previousAvailable: {
      type: Number,
      required: true,
    },

    newAvailable: {
      type: Number,
      required: true,
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

leaveBalanceAdjustmentSchema.index({
  user: 1,
  createdAt: -1,
});

leaveBalanceAdjustmentSchema.index({
  leaveBalance: 1,
  createdAt: -1,
});

const LeaveBalanceAdjustment = mongoose.model("LeaveBalanceAdjustment", leaveBalanceAdjustmentSchema);

export default LeaveBalanceAdjustment;
