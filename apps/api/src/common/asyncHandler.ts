import type { NextFunction, Request, Response } from "express";

// Wraps async route handlers so a rejected promise is forwarded to
// Express's error-handling middleware instead of crashing the process
// or hanging the request.
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
