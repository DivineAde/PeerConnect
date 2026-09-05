import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "@peerconnect/validation";

describe("registerSchema", () => {
  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid registration payload and lowercases the email", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "Passw0rd!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });
});
