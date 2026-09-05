import type { RegisterInput, LoginInput } from "@peerconnect/validation";
import type { UserPrivateDTO } from "@peerconnect/types";
import { apiRequest } from "./client";

export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<{ user: UserPrivateDTO }>("/api/auth/register", { method: "POST", body: input }),
  login: (input: LoginInput) =>
    apiRequest<{ user: UserPrivateDTO }>("/api/auth/login", { method: "POST", body: input }),
  logout: () => apiRequest<{ loggedOut: true }>("/api/auth/logout", { method: "POST" }),
  me: () => apiRequest<{ user: UserPrivateDTO }>("/api/auth/me"),
  googleUrl: () => `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/google`,
};
