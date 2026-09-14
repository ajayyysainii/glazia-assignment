import type { Response } from "express";
import type { HttpStatusCode } from "../constants/httpStatus.js";

type SuccessBody = {
  success: true;
  statusCode: HttpStatusCode;
  message?: string;
  data?: unknown;
};

export function sendSuccess(
  res: Response,
  statusCode: HttpStatusCode,
  payload: { data?: unknown; message?: string } = {},
) {
  if (statusCode === 204) {
    return res.status(204).send();
  }

  const body: SuccessBody = {
    success: true,
    statusCode,
    ...payload,
  };

  return res.status(statusCode).json(body);
}
