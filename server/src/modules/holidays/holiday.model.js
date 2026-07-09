import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      minLength: [2, "Holiday name must contain at least 2 characters"],
      maxLength: [80, "Holiday name cannot exceed 80 characters"],
    },

    date: {
      type: Date,
      required: [true, "Holiday date is required"],
    },

    type: {
      type: String,
      enum: {
        values: ["PUBLIC", "COMPANY", "OPTIONAL"],
        message: "Holiday type must be PUBLIC, COMPANY or OPTIONAL",
      },
      default: "PUBLIC",
    },

    description: {
      type: String,
      trim: true,
      maxLength: [300, "Description cannot exceed 300 characters"],
      default: "",
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

holidaySchema.index(
  {
    date: 1,
  },
  {
    unique: true,
  },
);

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
