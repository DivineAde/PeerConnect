// Shared DTO shapes returned by the API and consumed by the web app.
// Kept independent from Prisma's generated types so the API is free to
// shape its responses (e.g. omitting passwordHash) without the frontend
// depending on database internals.

export type ConnectionStatusDTO = "PENDING" | "ACCEPTED" | "REJECTED";

export interface UserPublicDTO {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserPrivateDTO extends UserPublicDTO {
  email: string;
  updatedAt: string;
}

// Relationship of the *current* viewer to another user, used to drive
// the Connect / Pending / Accept / Connected / Remove button state.
export type ViewerRelationship =
  | "SELF"
  | "NONE"
  | "PENDING_OUTGOING"
  | "PENDING_INCOMING"
  | "CONNECTED";

export interface UserWithRelationshipDTO extends UserPublicDTO {
  relationship: ViewerRelationship;
  connectionId: string | null;
}

export interface ConnectionDTO {
  id: string;
  status: ConnectionStatusDTO;
  createdAt: string;
  updatedAt: string;
  user: UserPublicDTO; // the *other* user in the connection, from the viewer's perspective
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;
