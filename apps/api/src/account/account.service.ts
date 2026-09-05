import { prisma } from "@peerconnect/database";
import type { UpdateAccountInput } from "@peerconnect/validation";

export async function getMyAccount(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

export async function updateMyAccount(userId: string, input: UpdateAccountInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.headline !== undefined ? { headline: input.headline || null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
      ...(input.location !== undefined ? { location: input.location || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
    },
  });
}
