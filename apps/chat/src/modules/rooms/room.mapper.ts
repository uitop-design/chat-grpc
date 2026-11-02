import { chat } from "@app/contracts";

import { Prisma } from "../../generated/prisma/client.js";

export function roomDetailsInclude(userId: string) {
  return {
    _count: { select: { members: true } },
    members: { where: { userId }, select: { userId: true } },
  } satisfies Prisma.RoomInclude;
}

export type RoomWithDetails = Prisma.RoomGetPayload<{ include: ReturnType<typeof roomDetailsInclude> }>;

export function toRoomResponse(room: RoomWithDetails): chat.Room {
  return {
    id: room.id,
    name: room.name,
    ownerId: room.ownerId,
    memberCount: room._count.members,
    joined: room.members.length > 0,
    createdAt: room.createdAt.toISOString(),
  };
}
