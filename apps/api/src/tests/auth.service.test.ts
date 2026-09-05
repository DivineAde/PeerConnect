import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the shared Prisma singleton so these tests exercise real business
// logic (password hashing, duplicate-email rejection, credential
// checking) without needing a live Postgres instance. Integration tests
// against a real database can layer on top of this using the same
// service functions once CI has a Postgres service container.
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
};

vi.mock("@peerconnect/database", () => ({ prisma: prismaMock }));
vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "test-access-secret-that-is-long-enough",
    JWT_REFRESH_SECRET: "test-refresh-secret-that-is-long-enough",
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL_DAYS: 30,
    COOKIE_DOMAIN: "",
  },
  isProduction: false,
}));

const { register, login } = await import("../auth/auth.service");
const { AppError } = await import("../common/AppError");

const ctx = { userAgent: "vitest", ipAddress: "127.0.0.1" };

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("rejects an email that is already registered", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user" });

      await expect(
        register({ name: "Ada Lovelace", email: "ada@example.com", password: "Passw0rd!" }, ctx)
      ).rejects.toMatchObject({ code: "EMAIL_TAKEN", statusCode: 409 });

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("creates a user with a hashed (not plaintext) password", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: "new-user", ...data })
      );
      prismaMock.refreshToken.create.mockResolvedValue({});

      const { user } = await register(
        { name: "Ada Lovelace", email: "ada@example.com", password: "Passw0rd!" },
        ctx
      );

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe("Passw0rd!");
    });
  });

  describe("login", () => {
    it("rejects an unknown email without revealing that the account doesn't exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        login({ email: "nobody@example.com", password: "Passw0rd!" }, ctx)
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", statusCode: 400 });
    });

    it("rejects an incorrect password with the same generic error", async () => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("CorrectPassw0rd!", 12);
      prismaMock.user.findUnique.mockResolvedValue({ id: "u1", passwordHash });

      await expect(
        login({ email: "ada@example.com", password: "WrongPassword!" }, ctx)
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("succeeds with correct credentials and issues a token pair", async () => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("CorrectPassw0rd!", 12);
      prismaMock.user.findUnique.mockResolvedValue({ id: "u1", passwordHash });
      prismaMock.refreshToken.create.mockResolvedValue({});

      const { tokens } = await login({ email: "ada@example.com", password: "CorrectPassw0rd!" }, ctx);

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
    });
  });
});
