import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../common/AppError";
import { cookieNames, verifyAccessToken } from "../auth/tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Protects a route: requires a valid, unexpired access-token cookie.
// Deliberately does NOT try to refresh here — refreshing is a distinct
// endpoint the frontend's API client calls explicitly on a 401, which
// keeps this middleware simple and avoids surprising side effects.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[cookieNames.ACCESS_COOKIE];

  if (!token) {
    return next(AppError.unauthorized("Please log in to continue.", "NO_ACCESS_TOKEN"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized("Your session has expired.", "ACCESS_TOKEN_EXPIRED"));
    }
    return next(AppError.unauthorized("Your session is invalid. Please log in again.", "INVALID_ACCESS_TOKEN"));
  }
}
