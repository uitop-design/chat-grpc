import {
  AlreadyExistsRpcException,
  FailedPreconditionRpcException,
  isPrismaError,
  NotFoundRpcException,
  PermissionDeniedRpcException,
  PrismaErrorCode,
} from "@app/common";
import { chat } from "@app/contracts";
import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/index.js";
import { RoomEventsService } from "../events/index.js";
import { roomDetailsInclude, toRoomResponse } from "./room.mapper.js";

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomEvents: RoomEventsService,
  ) {}

  async create(name: string, userId: string): Promise<chat.Room> {
    try {
      const room = await this.prisma.room.create({
        data: { name, ownerId: userId, members: { create: { userId } } },
        include: roomDetailsInclude(userId),
      });

      return toRoomResponse(room);
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.UniqueConstraint)) {
        throw new AlreadyExistsRpcException("Room name is already taken");
      }

      throw error;
    }
  }

  async list(userId: string, joinedOnly: boolean): Promise<chat.Room[]> {
    const rooms = await this.prisma.room.findMany({
      where: joinedOnly ? { members: { some: { userId } } } : undefined,
      include: roomDetailsInclude(userId),
      orderBy: { createdAt: "desc" },
    });

    return rooms.map(toRoomResponse);
  }

  async join(roomId: string, userId: string): Promise<chat.Room> {
    try {
      await this.prisma.roomMember.upsert({
        where: { roomId_userId: { roomId, userId } },
        create: { roomId, userId },
        update: {},
      });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.ForeignKeyConstraint)) {
        throw new NotFoundRpcException("Room not found");
      }

      throw error;
    }

    return this.getById(roomId, userId);
  }

  async leave(roomId: string, userId: string): Promise<chat.LeaveRoomResponse> {
    const { count } = await this.prisma.roomMember.deleteMany({ where: { roomId, userId } });

    if (count === 0) {
      await this.ensureRoomExists(roomId);

      throw new FailedPreconditionRpcException("You are not a member of this room");
    }

    this.roomEvents.publishMemberLeft(roomId, userId);

    return { roomId };
  }

  async ensureMember(roomId: string, userId: string): Promise<void> {
    const membership = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { roomId: true },
    });

    if (membership) {
      return;
    }

    await this.ensureRoomExists(roomId);

    throw new PermissionDeniedRpcException("Join the room first");
  }

  private async getById(roomId: string, userId: string): Promise<chat.Room> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: roomDetailsInclude(userId) });

    if (!room) {
      throw new NotFoundRpcException("Room not found");
    }

    return toRoomResponse(room);
  }

  private async ensureRoomExists(roomId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });

    if (!room) {
      throw new NotFoundRpcException("Room not found");
    }
  }
}
