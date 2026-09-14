import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError("Route not found", 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : String(err),
  });
}
