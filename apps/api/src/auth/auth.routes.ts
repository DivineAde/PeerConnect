import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/requireAuth";
import { googleOAuthEnabled } from "../config/env";
import { passport } from "./passport";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, authController.register);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);

if (googleOAuthEnabled) {
  authRouter.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );
  authRouter.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    authController.googleCallback
  );
} else {
  // Keep the routes present (rather than 404ing) so the frontend's
  // "Continue with Google" button always has somewhere valid to send
  // the user, even when OAuth isn't configured in this environment.
  authRouter.get("/google", authController.googleUnavailable);
  authRouter.get("/google/callback", authController.googleUnavailable);
}
