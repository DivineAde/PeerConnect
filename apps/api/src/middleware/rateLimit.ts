import rateLimit from "express-rate-limit";

// Only the authentication endpoints get a rate limit — this is a small
// challenge app, not a public API that needs limits everywhere, and
// over-applying rate limiting tends to just create confusing false
// positives during normal use (e.g. the token refresh polling).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Please wait a few minutes and try again.",
    },
  },
});
