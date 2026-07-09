import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      minLength: [2, "Department name must contain at least 2 characters"],
      maxLength: [60, "Department name cannot exceed 60 characters"],
    },

    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minLength: [2, "Department code must contain at least 2 characters"],
      maxLength: [10, "Department code cannot exceed 10 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxLength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    maximumConcurrentLeaves: {
      type: Number,
      min: [1, "Maximum concurrent leaves must be at least 1"],
      default: 3,
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

departmentSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  },
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;
