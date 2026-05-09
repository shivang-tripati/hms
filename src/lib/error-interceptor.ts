import logger from "./logger";

export class UserError extends Error {
  public userMessage: string;
  public statusCode: number;

  constructor(message: string, userMessage: string, statusCode: number = 400) {
    super(message);
    this.name = "UserError";
    this.userMessage = userMessage;
    this.statusCode = statusCode;
  }
}

export function setupGlobalErrorHandlers() {
  if (typeof window !== "undefined") {
    // Client-side handlers
    window.onerror = (message, source, lineno, colno, error) => {
      logger.error("Client Uncaught Exception", {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
      });
    };

    window.onunhandledrejection = (event) => {
      logger.error("Client Unhandled Rejection", {
        reason: event.reason,
      });
    };
  } else {
    // Server-side handlers
    process.on("uncaughtException", (error) => {
      logger.error("Server Uncaught Exception", {
        message: error.message,
        stack: error.stack,
      });
      // In production, we don't want to crash, but in dev we might want to see it
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Server Unhandled Rejection", {
        reason: reason instanceof Error ? reason.stack : reason,
      });
    });
  }
}
