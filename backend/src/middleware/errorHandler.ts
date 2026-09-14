import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { HttpStatus } from "../constants/httpStatus.js";
import { AppError } from "../utils/AppError.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound("Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      statusCode: HttpStatus.UNAUTHORIZED,
      code: "TOKEN_EXPIRED",
      message: "Token expired",
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      statusCode: HttpStatus.UNAUTHORIZED,
      code: "INVALID_TOKEN",
      message: "Invalid token",
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message]),
      ),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      code: "INVALID_ID",
      message: `Invalid ${err.path}: ${String(err.value)}`,
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    return res.status(HttpStatus.CONFLICT).json({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      code: "DUPLICATE_KEY",
      message: "Email already registered",
    });
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      code: "INVALID_JSON",
      message: "Malformed JSON in request body",
    });
  }

  console.error(err);
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: "INTERNAL_SERVER_ERROR",
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : String(err),
  });
}
