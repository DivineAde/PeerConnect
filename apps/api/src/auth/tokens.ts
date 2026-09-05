import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env, isProduction } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // user id
}

const ACCESS_COOKIE = "pc_access_token";
const REFRESH_COOKIE = "pc_refresh_token";

export function signAccessToken(userId: string): string {
  const options: jwt.SignOptions = {
    // jsonwebtoken's types want a `StringValue` template-literal type
    // (e.g. "15m") rather than a bare `string` for `expiresIn`, even
    // though any valid duration string works at runtime. The env var is
    // validated as a non-empty string at startup, so this cast is safe.
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Refresh tokens are opaque random values, not JWTs — the server is the
// only party that ever needs to interpret them, and storing only a hash
// in the database means a leaked DB doesn't leak usable sessions.
export function generateOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Cross-domain deployment (frontend and API on different domains) needs
// SameSite=None + Secure so the browser will send the cookie on the
// cross-site API request at all. In local dev (http://localhost) that
// combination is rejected by browsers, so we fall back to Lax + non-secure.
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(
    REFRESH_COOKIE,
    refreshToken,
    cookieOptions(env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  );
}

export function clearAuthCookies(res: Response) {
  const opts = cookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

export const cookieNames = { ACCESS_COOKIE, REFRESH_COOKIE };
