import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return next(AppError.unauthorized("Missing Authorization header"));
  }

  if (!header.startsWith("Bearer ")) {
    return next(
      AppError.unauthorized("Authorization header must use Bearer scheme"),
    );
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return next(AppError.unauthorized("Access token is required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      return next(AppError.unauthorized("Access token expired"));
    }
    next(AppError.unauthorized("Invalid or expired access token"));
  }
}
