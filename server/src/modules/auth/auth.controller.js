import User from "../users/user.model.js";

import { createAuditLog, runAuditTask } from "../auditLogs/auditLog.service.js";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../constants/audit.js";

import { getAuthCookieOptions, getClearCookiesOptions } from "../../utils/authCookie.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import { AppError } from "../../utils/AppError.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw new AppError("Email and Password are required", 400, "MISSING_CREDENTIALS");

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      await runAuditTask("login-failed-invalid-credentials", () =>
        createAuditLog({
          actor: user || null,
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          entityType: AUDIT_ENTITY_TYPES.AUTH,
          entityId: user?._id || null,
          description: "A login attempt failed because the credentials were invalid.",
          metadata: {
            email: normalizedEmail,
            reason: "INVALID_CREDENTIALS",
          },
          success: false,
          request: req,
        }),
      );
      throw new AppError("Invalid Email or Password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      await runAuditTask("login-failed-inactive-account", () =>
        createAuditLog({
          actor: user,
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          entityType: AUDIT_ENTITY_TYPES.AUTH,
          entityId: user._id,
          description: "A login attempt was rejected because the account is inactive.",
          metadata: {
            email: user.email,
            reason: "INACTIVE_ACCOUNT",
          },
          success: false,
          request: req,
        }),
      );
      throw new AppError("Your Account has been Deactivated", 401, "INACTIVE_ACCOUNT");
    }

    const token = signAccessToken(user._id);
    const loginTime = new Date();
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          lastLoginAt: loginTime,
        },
      },
    );
    user.lastLoginAt = loginTime;
    res.cookie("accessToken", token, getAuthCookieOptions());

    await runAuditTask("login-success", () =>
      createAuditLog({
        actor: user,
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        entityType: AUDIT_ENTITY_TYPES.AUTH,
        entityId: user._id,
        description: "User logged in successfully.",
        metadata: {
          email: user.email,
        },
        request: req,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      mustChangePassword: user.mustChangePassword,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string")
      throw new AppError("Current password, new password, and password confirmation are required.", 400, "MISSING_CREDENTIALS");

    if (newPassword !== confirmPassword)
      throw new AppError("Passwords do not match. Please verify your new password.", 400, "PASSWORD_MISMATCH");

    if (newPassword.length < 8 || newPassword.length > 72)
      throw new AppError("New password must be between 8 and 72 characters long.", 400, "INVALID_PASSWORD_LENGTH");

    const user = await User.findById(req.user._id).select("+password");
    if (!user) throw new AppError("User account not found.", 404, "USER_NOT_FOUND");

    const currentPasswordIsCorrect = await user.comparePassword(currentPassword);
    if (!currentPasswordIsCorrect) throw new AppError("The current password provided is incorrect.", 401, "INCORRECT_PASSWORD");

    const sameAsCurrentPassword = await user.comparePassword(newPassword);
    if (sameAsCurrentPassword)
      throw new AppError("The new password must be different from your current password.", 400, "PASSWORD_REUSE_FORBIDDEN");

    // This must be the plain password. User model's pre-save middleware will hash it.
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Issue a fresh token because passwordChangedAt invalidates tokens created before the password change.
    const token = signAccessToken(user._id);
    res.cookie("accessToken", token, getAuthCookieOptions());

    await runAuditTask("password-changed", () =>
      createAuditLog({
        actor: user,
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.AUTH,
        entityId: user._id,
        description: "User changed their account password.",
        metadata: {
          mustChangePassword: false,
        },
        request: req,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      mustChangePassword: false,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  try {
    let actor = null;
    const token = req.cookies?.accessToken;

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        actor = await User.findById(decoded.sub);
      } catch {
        actor = null;
      }
    }

    res.clearCookie("accessToken", getClearCookiesOptions());

    await runAuditTask("logout", () =>
      createAuditLog({
        actor,
        action: AUDIT_ACTIONS.LOGOUT,
        entityType: AUDIT_ENTITY_TYPES.AUTH,
        entityId: actor?._id || null,
        description: actor ? "User logged out successfully." : "An authentication cookie was cleared.",
        request: req,
      }),
    );
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}

export function getCurrentUser(req, res) {
  try {
    return res.status(200).json({
      success: true,
      mustChangePassword: req.user.mustChangePassword,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}
