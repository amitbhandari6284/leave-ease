import "dotenv/config";

import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/database.js";

import { validateEnvironment } from "./config/validateEnvironment.js";

let server = null;
let isShuttingDown = false;

async function closeHttpServer() {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function closeDatabaseConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function shutdown(reason, exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Shutting down server: ${reason}`);

  /*
    Prevent the process from hanging indefinitely if an external
    connection refuses to close.
  */
  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out");

    process.exit(1);
  }, 10_000);

  forceExitTimer.unref();

  try {
    await closeHttpServer();

    console.log("HTTP server stopped accepting connections");

    await closeDatabaseConnection();

    console.log("MongoDB connection closed");

    clearTimeout(forceExitTimer);

    process.exit(exitCode);
  } catch (error) {
    console.error("Graceful shutdown failed:", error);

    clearTimeout(forceExitTimer);

    process.exit(1);
  }
}

async function startServer() {
  const environment = validateEnvironment();

  await connectDB();

  server = app.listen(environment.port, () => {
    console.log(`Server running on port ${environment.port} in ${environment.nodeEnvironment} mode`);
  });

  /*
    Handle errors emitted directly by the HTTP server.
  */
  server.on("error", (error) => {
    console.error("HTTP server error:", error);

    void shutdown("HTTP_SERVER_ERROR", 1);
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM", 0);
});

process.on("SIGINT", () => {
  void shutdown("SIGINT", 0);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);

  void shutdown("UNHANDLED_REJECTION", 1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);

  void shutdown("UNCAUGHT_EXCEPTION", 1);
});

startServer().catch((error) => {
  console.error("Server startup failed:", error);

  void closeDatabaseConnection().finally(() => {
    process.exit(1);
  });
});
