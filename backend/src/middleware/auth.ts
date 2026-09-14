import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
}
