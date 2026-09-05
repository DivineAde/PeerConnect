import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "@peerconnect/validation";
import { asyncHandler } from "../common/asyncHandler";
import { sendSuccess } from "../common/apiResponse";
import { toPrivateUserDTO } from "../common/dto";
import { AppError } from "../common/AppError";
import { env, googleOAuthEnabled } from "../config/env";
import * as authService from "./auth.service";
import { clearAuthCookies, cookieNames, setAuthCookies } from "./tokens";

function requestContext(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register(input, requestContext(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return sendSuccess(res, { user: toPrivateUserDTO(user) }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(input, requestContext(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return sendSuccess(res, { user: toPrivateUserDTO(user) });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[cookieNames.REFRESH_COOKIE];
  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }
  clearAuthCookies(res);
  return sendSuccess(res, { loggedOut: true });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[cookieNames.REFRESH_COOKIE];
  if (!refreshToken) {
    throw AppError.unauthorized("Please log in to continue.", "NO_REFRESH_TOKEN");
  }
  const { user, tokens } = await authService.refreshSession(refreshToken, requestContext(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return sendSuccess(res, { user: toPrivateUserDTO(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.userId!);
  return sendSuccess(res, { user: toPrivateUserDTO(user) });
});

export const googleUnavailable = (_req: Request, res: Response) => {
  const redirectUrl = new URL("/login", env.WEB_URL);
  redirectUrl.searchParams.set("error", "google_oauth_not_configured");
  res.redirect(redirectUrl.toString());
};

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const profile = req.user as {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };

  const { tokens } = await authService.loginOrRegisterWithGoogle(profile, requestContext(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  const redirectUrl = new URL("/dashboard", env.WEB_URL);
  res.redirect(redirectUrl.toString());
});

export { googleOAuthEnabled };
