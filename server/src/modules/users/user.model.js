import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { USER_ROLES, USER_ROLE_VALUES } from "../../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name Must be at least 2 characters"],
      maxlength: [40, "Name Must be at below 40 characters"],
    },
    email: {
      type: String,
      require: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      require: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLE_VALUES,
        message: "Invalid user role '{VALUE}'",
      },
      default: USER_ROLES.EMPLOYEE,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [80, "Designation cannot exceed 80 characters"],
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(document, returnedObject) {
        delete returnedObject.password;
        delete returnedObject.__v;
        delete returnedObject.passwordChangedAt;

        return returnedObject;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);

  /*
    New accounts do not need this timestamp because they had
    no previously issued tokens.

    Existing accounts receive a timestamp so JWTs issued before
    the password change can be rejected.
  */
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) {
    return false;
  }

  const passwordChangedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

  return jwtIssuedAt < passwordChangedTimestamp;
};

const User = mongoose.model("User", userSchema);

export default User;
