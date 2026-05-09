import logger from "./logger";
import { UserError } from "./error-interceptor";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export type ActionResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; requestId?: string };

export function withActionError<T, Args extends any[]>(
  action: (...args: Args) => Promise<T>,
  options: { allowedRoles?: UserRole[] } = {}
): (...args: Args) => Promise<ActionResponse<T>> {
  return async (...args: Args): Promise<ActionResponse<T>> => {
    const requestId = crypto.randomUUID();
    
    try {
      const session = await auth();
      if (!session) return { success: false, error: "Unauthorized" };

      if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
        logger.warn("Forbidden Server Action attempt", { 
          userId: session.user.id, 
          role: session.user.role 
        });
        return { success: false, error: "Forbidden: Insufficient permissions" };
      }

      const data = await action(...args);
      return { success: true, data };
    } catch (error: any) {
      const requestId = crypto.randomUUID();
      const errorMessage = error instanceof UserError ? error.userMessage : error?.message || "An error occurred while processing your request.";

      logger.error("Server Action Error", {
        requestId,
        error: error.message,
        stack: error.stack,
        args: JSON.stringify(args).substring(0, 500), // Limit size
      });

      return {
        success: false,
        error: errorMessage,
        requestId,
      };
    }
  };
}
