import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Leave type name is required"],
      trim: true,
      minLength: [2, "Leave type name must contain at least 2 characters"],
      maxLength: [60, "Leave type name cannot exceed 60 characters"],
    },

    code: {
      type: String,
      required: [true, "Leave type code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minLength: [1, "Leave type code is required"],
      maxLength: [10, "Leave type code cannot exceed 10 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxLength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    yearlyAllowance: {
      type: Number,
      required: [true, "Yearly allowance is required"],
      min: [0, "Yearly allowance cannot be negative"],
    },

    maxConsecutiveDays: {
      type: Number,
      min: [1, "Maximum consecutive days must be at least 1"],
      default: 5,
    },

    carryForwardLimit: {
      type: Number,
      min: [0, "Carry-forward limit cannot be negative"],
      default: 0,
    },

    allowHalfDay: {
      type: Boolean,
      default: false,
    },

    isPaid: {
      type: Boolean,
      default: true,
    },

    requiresDocument: {
      type: Boolean,
      default: false,
    },

    documentRequiredAfterDays: {
      type: Number,
      min: [1, "Document requirement must begin after at least 1 day"],
      default: null,
    },

    genderRestriction: {
      type: String,
      enum: {
        values: ["NONE", "MALE", "FEMALE"],
        message: "Gender restriction must be NONE, MALE or FEMALE",
      },
      default: "NONE",
    },

    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid six-digit hex color"],
      default: "#4F46E5",
    },

    isActive: {
      type: Boolean,
      default: true,
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

leaveTypeSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  },
);

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

export default LeaveType;
