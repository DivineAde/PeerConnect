// A single, predictable error shape used throughout the API. Every
// deliberately-thrown error should be an AppError so the centralized
// error handler can turn it into a consistent JSON response with the
// correct HTTP status code.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static badRequest(code: string, message: string, fieldErrors?: Record<string, string>) {
    return new AppError(400, code, message, fieldErrors);
  }

  static unauthorized(message = "You need to be logged in to do that.", code = "UNAUTHENTICATED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "You don't have permission to do that.", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static notFound(message = "We couldn't find what you were looking for.", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }

  static tooManyRequests(message = "Too many attempts. Please wait a moment and try again.") {
    return new AppError(429, "TOO_MANY_REQUESTS", message);
  }

  static internal(message = "Something unexpected happened on our end. Please try again.") {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
