export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setupGlobalErrorHandlers } = await import("./lib/error-interceptor");
    const logger = (await import("./lib/logger")).default;

    setupGlobalErrorHandlers();
    
    logger.info("Application initialized with production logging system");

    // Optional: Daily cleanup job if needed beyond winston's rotation
    // This runs every 24 hours
    setInterval(() => {
      logger.info("Running daily log maintenance check...");
      // Winston DailyRotateFile handles deletion based on maxFiles, 
      // but we can add extra logic here if required.
    }, 24 * 60 * 60 * 1000);
  }
}
