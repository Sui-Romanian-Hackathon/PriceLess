import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: _req.path,
    method: _req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        error: "Unique constraint violation",
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        statusCode: 409,
      });
    }
    if (prismaErr.code === "P2025") {
      return res.status(404).json({
        error: "Record not found",
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }
  }

  // Default error response
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
};
