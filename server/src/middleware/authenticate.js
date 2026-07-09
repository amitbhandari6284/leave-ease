import User from "../modules/users/user.model.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  try {
    // Get Token from req.cookies.accessToken(provided by cookie-parser middleware)
    const token = req.cookies.accessToken;

    // check if there is token otherwise send 401
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // verify token and find user
    const decoded = await verifyAccessToken(token);
    const user = await User.findById(decoded.sub);

    // check if user corresponding to token exists in DB
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this session no longer exists",
      });
    }
    // check if user is active or not
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }
    // check if password changed after issuing token
    if (user.changePasswordAfter) {
      return res.status(401).json({
        success: false,
        message: "Password was changed after this session started. Log In again",
      });
    }

    // pass on the user data(saves extra query)
    req.user = user;

    next();
  } catch (error) {
    // if token is expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // if token is invalid
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }
    next(error);
  }
}
