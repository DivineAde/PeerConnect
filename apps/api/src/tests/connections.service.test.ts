import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  connection: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@peerconnect/database", () => ({ prisma: prismaMock }));

const { sendConnectionRequest, respondToRequest, removeConnection } = await import(
  "../connections/connections.service"
);

describe("connections.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendConnectionRequest", () => {
    it("prevents a user from connecting with themselves", async () => {
      await expect(sendConnectionRequest("user-1", "user-1")).rejects.toMatchObject({
        code: "SELF_CONNECTION",
      });
      expect(prismaMock.connection.create).not.toHaveBeenCalled();
    });

    it("rejects a duplicate request when one is already pending", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "user-2", name: "Amara" });
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "PENDING",
        requesterId: "user-1",
        receiverId: "user-2",
      });

      await expect(sendConnectionRequest("user-1", "user-2")).rejects.toMatchObject({
        code: "CONNECTION_ALREADY_EXISTS",
        statusCode: 409,
      });
      expect(prismaMock.connection.create).not.toHaveBeenCalled();
    });

    it("rejects a request between users who are already connected", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "user-2", name: "Amara" });
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "ACCEPTED",
        requesterId: "user-2",
        receiverId: "user-1",
      });

      await expect(sendConnectionRequest("user-1", "user-2")).rejects.toMatchObject({
        code: "ALREADY_CONNECTED",
      });
    });

    it("creates a new pending connection when none exists", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-2",
        name: "Amara",
        createdAt: new Date(),
      });
      prismaMock.connection.findUnique.mockResolvedValue(null);
      prismaMock.connection.create.mockResolvedValue({
        id: "c1",
        status: "PENDING",
        requesterId: "user-1",
        receiverId: "user-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await sendConnectionRequest("user-1", "user-2");
      expect(result.status).toBe("PENDING");
      expect(prismaMock.connection.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("respondToRequest", () => {
    it("only allows the receiver to accept a request", async () => {
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "PENDING",
        requesterId: "user-1",
        receiverId: "user-2",
      });

      await expect(respondToRequest("user-1", "c1", "ACCEPT")).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
    });

    it("rejects responding to a request that isn't pending", async () => {
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "ACCEPTED",
        requesterId: "user-1",
        receiverId: "user-2",
      });

      await expect(respondToRequest("user-2", "c1", "ACCEPT")).rejects.toMatchObject({
        code: "CONNECTION_NOT_PENDING",
      });
    });
  });

  describe("removeConnection", () => {
    it("prevents a user who isn't part of the connection from removing it", async () => {
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "ACCEPTED",
        requesterId: "user-1",
        receiverId: "user-2",
      });

      await expect(removeConnection("user-3", "c1")).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
      expect(prismaMock.connection.delete).not.toHaveBeenCalled();
    });

    it("prevents the receiver from silently deleting an incoming pending request (must accept/reject)", async () => {
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "PENDING",
        requesterId: "user-1",
        receiverId: "user-2",
      });

      await expect(removeConnection("user-2", "c1")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("allows the requester to cancel their own pending outgoing request", async () => {
      prismaMock.connection.findUnique.mockResolvedValue({
        id: "c1",
        status: "PENDING",
        requesterId: "user-1",
        receiverId: "user-2",
      });
      prismaMock.connection.delete.mockResolvedValue({});

      const result = await removeConnection("user-1", "c1");
      expect(result.removed).toBe(true);
    });
  });
});
