import type { User } from "@peerconnect/database";
import type { UserPrivateDTO, UserPublicDTO } from "@peerconnect/types";

// Never let a raw Prisma User (which includes passwordHash, googleId,
// etc.) escape the service layer. These mappers are the single choke
// point that decides what's safe to send to the browser.

export function toPublicUserDTO(user: User): UserPublicDTO {
  return {
    id: user.id,
    name: user.name,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPrivateUserDTO(user: User): UserPrivateDTO {
  return {
    ...toPublicUserDTO(user),
    email: user.email,
    updatedAt: user.updatedAt.toISOString(),
  };
}
