import "dotenv/config";
import { z } from "zod";

// Fail fast and loudly if the environment is misconfigured, rather than
// discovering a missing secret three requests into production.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  API_URL: z.string().min(1).default("http://localhost:4000"),
  WEB_URL: z.string().min(1).default("http://localhost:3000"),
  CORS_EXTRA_ORIGINS: z.string().optional().default(""),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be set and reasonably long"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be set and reasonably long"),

  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  COOKIE_DOMAIN: z.string().optional().default(""),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[ENV] Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

export const corsOrigins = [
  env.WEB_URL,
  ...env.CORS_EXTRA_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
];

export const googleOAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL
);
