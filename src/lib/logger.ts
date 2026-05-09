import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const LOG_DIR = process.env.LOG_DIR || "logs";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transportOptions = {
  maxSize: "20m",
  maxFiles: "60d",
  zippedArchive: true,
  datePattern: "YYYY-MM-DD",
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "hms-service" },
  transports: [
    // Combined logs
    new DailyRotateFile({
      filename: path.join(LOG_DIR, "combined-%DATE%.log"),
      ...transportOptions,
    }),
    // Error logs only
    new DailyRotateFile({
      level: "error",
      filename: path.join(LOG_DIR, "error-%DATE%.log"),
      ...transportOptions,
    }),
  ],
});

// If not in production, also log to console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
