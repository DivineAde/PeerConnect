import type { UserWithRelationshipDTO } from "@peerconnect/types";
import { apiRequest } from "./client";

export const usersApi = {
  discover: (params: { q?: string; cursor?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.cursor) search.set("cursor", params.cursor);
    const qs = search.toString();
    return apiRequest<{ users: UserWithRelationshipDTO[]; nextCursor: string | null }>(
      `/api/users${qs ? `?${qs}` : ""}`
    );
  },
  getById: (id: string) => apiRequest<{ user: UserWithRelationshipDTO }>(`/api/users/${id}`),
};
