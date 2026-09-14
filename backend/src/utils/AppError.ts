import { HttpStatus, type HttpStatusCode } from "../constants/httpStatus.js";

export class AppError extends Error {
  statusCode: HttpStatusCode;
  code: string;
  isOperational: boolean;
  details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.BAD_REQUEST,
    options?: { code?: string; details?: unknown },
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = options?.code ?? defaultCodeForStatus(statusCode);
    this.details = options?.details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, HttpStatus.BAD_REQUEST, {
      code: "BAD_REQUEST",
      details,
    });
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, HttpStatus.UNAUTHORIZED, {
      code: "UNAUTHORIZED",
    });
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, HttpStatus.FORBIDDEN, { code: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, HttpStatus.NOT_FOUND, { code: "NOT_FOUND" });
  }

  static conflict(message: string) {
    return new AppError(message, HttpStatus.CONFLICT, { code: "CONFLICT" });
  }

  static unprocessable(message: string, details?: unknown) {
    return new AppError(message, HttpStatus.UNPROCESSABLE_ENTITY, {
      code: "UNPROCESSABLE_ENTITY",
      details,
    });
  }
}

function defaultCodeForStatus(statusCode: HttpStatusCode) {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return "BAD_REQUEST";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "UNPROCESSABLE_ENTITY";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "TOO_MANY_REQUESTS";
    case HttpStatus.SERVICE_UNAVAILABLE:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}
