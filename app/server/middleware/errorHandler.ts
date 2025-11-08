import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(
  error: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = error instanceof HttpError ? error.status : 500;
  const response = {
    error: {
      message:
        status === 500 ? "Internal server error" : error.message,
      details:
        error instanceof HttpError ? error.details : undefined,
    },
  };

  if (status === 500) {
    console.error("[api] Unhandled error", error);
  }

  res.status(status).json(response);
}
