import type { Request, Response } from "express";
import { HttpStatus } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import * as canvasService from "./canvas.service.js";
import {
  canvasIdSchema,
  createCanvasSchema,
  updateCanvasSchema,
} from "./canvas.validation.js";

function requireUser(req: Request) {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const body = createCanvasSchema.parse(req.body ?? {});
  const canvas = await canvasService.createCanvas(user.id, body);
  return sendSuccess(res, HttpStatus.CREATED, {
    message: "Canvas created",
    data: { canvas },
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const canvases = await canvasService.listCanvases(user.id);
  return sendSuccess(res, HttpStatus.OK, {
    data: { canvases },
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = canvasIdSchema.parse(req.params);
  const canvas = await canvasService.getCanvasById(id, user.id);
  return sendSuccess(res, HttpStatus.OK, {
    data: { canvas },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = canvasIdSchema.parse(req.params);
  const body = updateCanvasSchema.parse(req.body);
  const canvas = await canvasService.updateCanvas(id, user.id, body);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Canvas saved",
    data: { canvas },
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = canvasIdSchema.parse(req.params);
  const result = await canvasService.deleteCanvas(id, user.id);
  return sendSuccess(res, HttpStatus.OK, {
    message: "Canvas deleted",
    data: result,
  });
});
