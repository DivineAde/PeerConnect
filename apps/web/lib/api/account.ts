import type { UpdateAccountInput } from "@peerconnect/validation";
import type { UserPrivateDTO } from "@peerconnect/types";
import { apiRequest } from "./client";

export const accountApi = {
  get: () => apiRequest<{ user: UserPrivateDTO }>("/api/account"),
  update: (input: UpdateAccountInput) =>
    apiRequest<{ user: UserPrivateDTO }>("/api/account", { method: "PATCH", body: input }),
};
