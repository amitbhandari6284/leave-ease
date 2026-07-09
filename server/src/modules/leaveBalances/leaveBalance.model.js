import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: [true, "Leave type is required"],
    },

    year: {
      type: Number,
      required: [true, "Balance year is required"],
      min: [2000, "Invalid balance year"],
      max: [2100, "Invalid balance year"],
    },

    entitled: {
      type: Number,
      required: [true, "Leave entitlement is required"],
      min: [0, "Leave entitlement cannot be negative"],
      default: 0,
    },

    carriedForward: {
      type: Number,
      min: [0, "Carried-forward balance cannot be negative"],
      default: 0,
    },

    used: {
      type: Number,
      min: [0, "Used leave cannot be negative"],
      default: 0,
    },

    pending: {
      type: Number,
      min: [0, "Pending leave cannot be negative"],
      default: 0,
    },

    adjustments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,

      transform(document, returnedObject) {
        delete returnedObject.__v;
        return returnedObject;
      },
    },

    toObject: {
      virtuals: true,
    },
  },
);

leaveBalanceSchema.virtual("available").get(function getAvailable() {
  return this.entitled + this.carriedForward + this.adjustments - this.used - this.pending;
});

leaveBalanceSchema.index(
  {
    user: 1,
    leaveType: 1,
    year: 1,
  },
  {
    unique: true,
  },
);

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
