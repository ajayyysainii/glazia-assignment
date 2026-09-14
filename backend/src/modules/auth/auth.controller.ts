import type { Request, Response } from "express";
import { HttpStatus } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
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
  return sendSuccess(res, HttpStatus.CREATED, {
    message: "User registered successfully",
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.loginUser(body);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Login successful",
    data: result,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const body = refreshSchema.parse(req.body);
  const result = await authService.refreshTokens(body.refreshToken);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Tokens refreshed",
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const body = logoutSchema.parse(req.body);
  await authService.logoutUser(body.refreshToken);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Logged out successfully",
  });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const result = await authService.logoutAllSessions(req.user.id);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Logged out from all sessions",
    data: result,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const user = await authService.getCurrentUser(req.user.id);
  return sendSuccess(res, HttpStatus.OK, {
    data: { user },
  });
});
