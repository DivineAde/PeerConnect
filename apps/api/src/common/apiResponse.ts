import type { Response } from "express";

// Ensures every successful response has the exact same envelope shape,
// per the API's "consistency over theoretical perfection" contract.
export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}
