import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import * as authService from "./auth.service.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await authService.registerUser(body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.loginUser(body);
  res.status(200).json({ success: true, data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const body = refreshSchema.parse(req.body);
  const result = await authService.refreshTokens(body.refreshToken);
  res.status(200).json({ success: true, data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const body = logoutSchema.parse(req.body);
  await authService.logoutUser(body.refreshToken);
  res.status(200).json({ success: true, message: "Logged out" });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  await authService.logoutAllSessions(req.user.id);
  res.status(200).json({ success: true, message: "Logged out from all sessions" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});
