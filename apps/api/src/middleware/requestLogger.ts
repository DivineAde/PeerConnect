import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../common/logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

// Logs one line per request in the shape called for by the brief:
// [INFO] POST /api/auth/login 200 142ms — as structured JSON so it's
// still easy to grep or ship to a log aggregator later.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  req.requestId = req.headers["x-request-id"]?.toString() || randomUUID();
  res.setHeader("x-request-id", req.requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(0)}ms`, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });

  next();
}
