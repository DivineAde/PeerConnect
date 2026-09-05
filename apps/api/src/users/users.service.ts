import { prisma, type Connection, type User } from "@peerconnect/database";
import type { UserWithRelationshipDTO, ViewerRelationship } from "@peerconnect/types";
import { AppError } from "../common/AppError";
import { toPublicUserDTO } from "../common/dto";

const PAGE_SIZE_DEFAULT = 20;

function relationshipFrom(
  viewerId: string,
  otherId: string,
  connection: { requesterId: string; status: string } | null
): ViewerRelationship {
  if (viewerId === otherId) return "SELF";
  if (!connection) return "NONE";
  if (connection.status === "ACCEPTED") return "CONNECTED";
  if (connection.status === "PENDING") {
    return connection.requesterId === viewerId ? "PENDING_OUTGOING" : "PENDING_INCOMING";
  }
  // REJECTED connections are treated as if they don't exist, so either
  // party can send a fresh request later.
  return "NONE";
}

export async function discoverUsers(
  viewerId: string,
  opts: { q?: string; cursor?: string; limit?: number }
) {
  const limit = opts.limit ?? PAGE_SIZE_DEFAULT;

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q, mode: "insensitive" } },
              { headline: { contains: opts.q, mode: "insensitive" } },
              { location: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
  });

  const hasMore = users.length > limit;
  const page: User[] = hasMore ? users.slice(0, limit) : users;

  const otherIds = page.map((u: User) => u.id);

  const connections: Connection[] = await prisma.connection.findMany({
    where: {
      OR: otherIds.map((otherId: string) => {
        const [userLowId, userHighId] = [viewerId, otherId].sort();
        return { userLowId, userHighId };
      }),
    },
  });

  const connectionByOtherId = new Map<string, Connection>();
  for (const c of connections) {
    const otherId = c.requesterId === viewerId ? c.receiverId : c.requesterId;
    connectionByOtherId.set(otherId, c);
  }

  const results: UserWithRelationshipDTO[] = page.map((u: User) => {
    const connection = connectionByOtherId.get(u.id) ?? null;
    return {
      ...toPublicUserDTO(u),
      relationship: relationshipFrom(viewerId, u.id, connection),
      connectionId: connection?.id ?? null,
    };
  });

  return {
    users: results,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

export async function getUserProfile(viewerId: string, targetUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw AppError.notFound("That profile doesn't exist.", "USER_NOT_FOUND");

  const [userLowId, userHighId] = [viewerId, targetUserId].sort();
  const connection = await prisma.connection.findUnique({
    where: { userLowId_userHighId: { userLowId, userHighId } },
  });

  const dto: UserWithRelationshipDTO = {
    ...toPublicUserDTO(user),
    relationship: relationshipFrom(viewerId, user.id, connection),
    connectionId: connection?.id ?? null,
  };
  return dto;
}
