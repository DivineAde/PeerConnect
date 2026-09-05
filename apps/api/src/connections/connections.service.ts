import { prisma, type Connection, type User } from "@peerconnect/database";
import type { ConnectionDTO } from "@peerconnect/types";
import { AppError } from "../common/AppError";
import { toPublicUserDTO } from "../common/dto";

// See prisma/schema.prisma for the full rationale. Short version: every
// pair of users has at most one Connection row, keyed by the normalized
// (userLowId, userHighId) pair, regardless of who requested or the
// current status. This single unique constraint is what makes duplicate
// requests and mirrored (A->B and B->A) rows structurally impossible.
function normalizedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function sendConnectionRequest(requesterId: string, receiverId: string) {
  if (requesterId === receiverId) {
    throw AppError.badRequest("SELF_CONNECTION", "You can't send a connection request to yourself.");
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw AppError.notFound("That person doesn't exist.", "USER_NOT_FOUND");
  }

  const [userLowId, userHighId] = normalizedPair(requesterId, receiverId);
  const existing = await prisma.connection.findUnique({
    where: { userLowId_userHighId: { userLowId, userHighId } },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw AppError.conflict("ALREADY_CONNECTED", "You're already connected with this person.");
    }
    if (existing.status === "PENDING") {
      throw AppError.conflict(
        "CONNECTION_ALREADY_EXISTS",
        "A connection request already exists between you and this person."
      );
    }
    // Previously REJECTED: allow a fresh request by reusing the row
    // (the unique constraint means we can't create a second one).
    const updated = await prisma.connection.update({
      where: { id: existing.id },
      data: { requesterId, receiverId, status: "PENDING" },
    });
    return toConnectionDTO(updated, receiver, requesterId);
  }

  const created = await prisma.connection.create({
    data: { requesterId, receiverId, status: "PENDING", userLowId, userHighId },
  });
  return toConnectionDTO(created, receiver, requesterId);
}

export async function respondToRequest(
  userId: string,
  connectionId: string,
  action: "ACCEPT" | "REJECT"
) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) throw AppError.notFound("That connection request doesn't exist.", "CONNECTION_NOT_FOUND");

  if (connection.receiverId !== userId) {
    throw AppError.forbidden("Only the recipient of a request can respond to it.");
  }
  if (connection.status !== "PENDING") {
    throw AppError.conflict("CONNECTION_NOT_PENDING", "This request has already been resolved.");
  }

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" },
  });

  const otherUser = await prisma.user.findUniqueOrThrow({ where: { id: connection.requesterId } });
  return toConnectionDTO(updated, otherUser, userId);
}

export async function removeConnection(userId: string, connectionId: string) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) throw AppError.notFound("That connection doesn't exist.", "CONNECTION_NOT_FOUND");

  const isParty = connection.requesterId === userId || connection.receiverId === userId;
  if (!isParty) {
    throw AppError.forbidden("You can only manage your own connections.");
  }

  if (connection.status === "PENDING" && connection.requesterId !== userId) {
    throw AppError.forbidden("Use accept or reject to respond to an incoming request.");
  }

  await prisma.connection.delete({ where: { id: connectionId } });
  return { removed: true };
}

export async function listAcceptedConnections(userId: string): Promise<ConnectionDTO[]> {
  const rows = await prisma.connection.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { receiverId: userId }] },
    include: { requester: true, receiver: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row: Connection & { requester: User; receiver: User }) => {
    const otherUser = row.requesterId === userId ? row.receiver : row.requester;
    return toConnectionDTO(row, otherUser, userId);
  });
}

export async function listIncomingRequests(userId: string): Promise<ConnectionDTO[]> {
  const rows = await prisma.connection.findMany({
    where: { status: "PENDING", receiverId: userId },
    include: { requester: true, receiver: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row: Connection & { requester: User; receiver: User }) =>
    toConnectionDTO(row, row.requester, userId)
  );
}

export async function listOutgoingRequests(userId: string): Promise<ConnectionDTO[]> {
  const rows = await prisma.connection.findMany({
    where: { status: "PENDING", requesterId: userId },
    include: { requester: true, receiver: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row: Connection & { requester: User; receiver: User }) =>
    toConnectionDTO(row, row.receiver, userId)
  );
}

export async function getNetworkSummary(userId: string) {
  const [connections, incoming] = await Promise.all([
    prisma.connection.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { receiverId: userId }] },
    }),
    prisma.connection.count({ where: { status: "PENDING", receiverId: userId } }),
  ]);
  return { connectionsCount: connections, pendingIncomingCount: incoming };
}

function toConnectionDTO(
  connection: { id: string; status: "PENDING" | "ACCEPTED" | "REJECTED"; createdAt: Date; updatedAt: Date },
  otherUser: Parameters<typeof toPublicUserDTO>[0],
  _viewerId: string
): ConnectionDTO {
  return {
    id: connection.id,
    status: connection.status,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
    user: toPublicUserDTO(otherUser),
  };
}
