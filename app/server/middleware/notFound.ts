import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./errorHandler";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new HttpError(404, "Resource not found"));
}
