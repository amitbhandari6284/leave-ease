// modules
import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

// middleware
import notFound from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimiter, loginRateLimiter } from "./middleware/rateLimiters.js";
import { attachRequestId } from "./middleware/requestId.js";

// routes
import authRouter from "./modules/auth/auth.routes.js";
import departmentRouter from "./modules/departments/department.routes.js";
import userRouter from "./modules/users/user.routes.js";
import leaveTypeRouter from "./modules/leaveTypes/leaveType.routes.js";
import leaveBalanceRouter from "./modules/leaveBalances/leaveBalance.routes.js";
import holidayRouter from "./modules/holidays/holiday.routes.js";
import leaveRequestRouter from "./modules/leaveRequests/leaveRequest.routes.js";
import calendarRouter from "./modules/calendar/calendar.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
import reportRouter from "./modules/reports/report.routes.js";
import auditLogRouter from "./modules/auditLogs/auditLog.routes.js";

const app = express();

app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.disable("x-powered-by");
app.set("query parser", "extended");

app.use(attachRequestId);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.get("/api/v1/health/live", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get("/api/v1/health/ready", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  const statusCode = databaseConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: databaseConnected,

    status: databaseConnected ? "ready" : "not_ready",

    services: {
      database: databaseConnected ? "connected" : "disconnected",
    },

    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRateLimiter);

app.use("/api/v1/auth/login", loginRateLimiter);

app.use(
  express.json({
    limit: "10kb",
    strict: true,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
    parameterLimit: 100,
  }),
);

app.use(cookieParser());

// Routes follow...

// Check wether Leave-Ease is running or not
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Leave-Ease API is running",
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/leave-types", leaveTypeRouter);
app.use("/api/v1/leave-balances", leaveBalanceRouter);
app.use("/api/v1/holidays", holidayRouter);
app.use("/api/v1/leave-requests", leaveRequestRouter);
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/audit-logs", auditLogRouter);

// Custom middleware
app.use(notFound);
app.use(errorHandler);

export default app;
