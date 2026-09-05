import type { ConnectionDTO } from "@peerconnect/types";
import { apiRequest } from "./client";

export const connectionsApi = {
  list: () => apiRequest<{ connections: ConnectionDTO[] }>("/api/connections"),
  requests: () => apiRequest<{ requests: ConnectionDTO[] }>("/api/connections/requests"),
  sent: () => apiRequest<{ sent: ConnectionDTO[] }>("/api/connections/sent"),
  summary: () =>
    apiRequest<{ connectionsCount: number; pendingIncomingCount: number }>("/api/connections/summary"),
  send: (userId: string) =>
    apiRequest<{ connection: ConnectionDTO }>(`/api/connections/${userId}`, { method: "POST" }),
  accept: (connectionId: string) =>
    apiRequest<{ connection: ConnectionDTO }>(`/api/connections/${connectionId}`, {
      method: "PATCH",
      body: { action: "ACCEPT" },
    }),
  reject: (connectionId: string) =>
    apiRequest<{ connection: ConnectionDTO }>(`/api/connections/${connectionId}`, {
      method: "PATCH",
      body: { action: "REJECT" },
    }),
  remove: (connectionId: string) =>
    apiRequest<{ removed: true }>(`/api/connections/${connectionId}`, { method: "DELETE" }),
};
