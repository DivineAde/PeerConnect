import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

// Parses/validates req.body against a zod schema and replaces req.body
// with the parsed (and coerced/trimmed) result. Validation errors are
// zod errors, which the centralized errorHandler turns into a
// field-level error response.
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.query = schema.parse(req.query);
    next();
  };
}
