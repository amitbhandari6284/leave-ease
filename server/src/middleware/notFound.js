import { AppError } from "../utils/AppError.js";

export default function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404, "ROUTE_NOT_FOUND"));
}
