import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import logger from "./logger";
import { UserError } from "./error-interceptor";

type Handler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

function getFriendlyMessage(error: any): string {
  if (error instanceof UserError) return error.userMessage;
  return error?.message || "An unexpected error occurred. Please try again later.";
}

function getStatusCode(error: any): number {
  if (error instanceof UserError) return error.statusCode;
  if (error?.name === "ZodError" || error?.name === "ValidationError") return 400;
  if (error?.message?.toLowerCase().includes("not found")) return 404;
  return 500;
}

export function withErrorHandling(handler: Handler, options: { allowedRoles?: UserRole[] } = {}) {
  return async (req: NextRequest, ...args: any[]) => {
    const requestId = crypto.randomUUID();
    
    try {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
        logger.warn("Forbidden API access attempt", { 
          userId: session.user.id, 
          role: session.user.role, 
          path: req.nextUrl.pathname 
        });
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }

      const response = await handler(req, ...args);
      return response;
    } catch (error: any) {
      const statusCode = getStatusCode(error);
      const friendlyMessage = getFriendlyMessage(error);
      
      logger.error("API Error", {
        requestId,
        path: req.nextUrl.pathname,
        method: req.method,
        error: error.message,
        stack: error.stack,
        statusCode,
      });

      return NextResponse.json(
        {
          error: friendlyMessage,
          requestId,
        },
        { status: statusCode }
      );
    }
  };
}
