import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@peerconnect/database";
import type { RegisterInput, LoginInput } from "@peerconnect/validation";
import { AppError } from "../common/AppError";
import { env } from "../config/env";
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
} from "./tokens";

const PASSWORD_SALT_ROUNDS = 12;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

async function issueTokenPair(userId: string, ctx: RequestContext): Promise<IssuedTokens> {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateOpaqueToken();

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      familyId: randomUUID(),
      expiresAt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput, ctx: RequestContext) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("EMAIL_TAKEN", "That email address is already registered.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      provider: "PASSWORD",
    },
  });

  const tokens = await issueTokenPair(user.id, ctx);
  return { user, tokens };
}

export async function login(input: LoginInput, ctx: RequestContext) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same error for "no such user" and "wrong password" so we don't leak
  // which emails are registered.
  const invalidCredentials = () =>
    AppError.badRequest("INVALID_CREDENTIALS", "That email and password combination doesn't match our records.");

  if (!user || !user.passwordHash) {
    throw invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw invalidCredentials();
  }

  const tokens = await issueTokenPair(user.id, ctx);
  return { user, tokens };
}

export async function loginOrRegisterWithGoogle(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}, ctx: RequestContext) {
  let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

  if (!user) {
    // Link by email if an email/password account already exists, so a
    // person doesn't end up with two disconnected accounts.
    const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: profile.googleId },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          provider: "GOOGLE",
          avatarUrl: profile.avatarUrl,
        },
      });
    }
  }

  const tokens = await issueTokenPair(user.id, ctx);
  return { user, tokens };
}

/**
 * Refresh-token rotation with reuse detection.
 *
 * Every refresh issues a brand-new token and immediately invalidates the
 * one that was just used (`replacedBy` + implicit consumption). If a
 * refresh token is presented that has *already* been replaced, that is a
 * strong signal the token was stolen and used by two different parties —
 * so we revoke the entire token family (every token issued from that
 * original login) and force re-authentication.
 */
export async function refreshSession(rawRefreshToken: string, ctx: RequestContext) {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  const invalidSession = () =>
    AppError.unauthorized("Your session has expired. Please log in again.", "INVALID_REFRESH_TOKEN");

  if (!stored) throw invalidSession();

  if (stored.revokedAt || stored.replacedBy) {
    // Reuse of an already-rotated token: revoke the whole family.
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw invalidSession();
  }

  if (stored.expiresAt < new Date()) {
    throw invalidSession();
  }

  const newRawToken = generateOpaqueToken();
  const newTokenHash = hashToken(newRawToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedBy: newTokenHash, revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: newTokenHash,
        familyId: stored.familyId,
        expiresAt,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
      },
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw invalidSession();

  const accessToken = signAccessToken(user.id);
  return { user, tokens: { accessToken, refreshToken: newRawToken } };
}

export async function revokeRefreshToken(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized();
  return user;
}
