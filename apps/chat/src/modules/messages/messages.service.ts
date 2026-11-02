import { InvalidArgumentRpcException, MESSAGE_CONTENT_MAX_LENGTH, RequestUser } from "@app/common";
import { chat } from "@app/contracts";
import { Injectable } from "@nestjs/common";
import { length } from "class-validator";

import { PrismaService } from "../../database/index.js";
import { RoomEventsService } from "../events/index.js";
import { RoomsService } from "../rooms/index.js";
import { toMessageResponse } from "./message.mapper.js";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
    private readonly roomEvents: RoomEventsService,
  ) {}

  async send({ roomId, content }: chat.SendMessageRequest, author: RequestUser): Promise<chat.Message> {
    const text = content.trim();

    if (!length(text, 1, MESSAGE_CONTENT_MAX_LENGTH)) {
      throw new InvalidArgumentRpcException(`Message must contain 1 to ${MESSAGE_CONTENT_MAX_LENGTH} characters`);
    }

    await this.roomsService.ensureMember(roomId, author.id);

    const message = await this.prisma.message.create({
      data: { roomId, authorId: author.id, authorName: author.username, content: text },
    });
    const response = toMessageResponse(message);

    this.roomEvents.publishMessage(response);

    return response;
  }

  async list({ roomId, limit, before }: chat.ListMessagesRequest, userId: string): Promise<chat.ListMessagesResponse> {
    await this.roomsService.ensureMember(roomId, userId);

    if (before) {
      await this.ensureCursorInRoom(roomId, before);
    }

    const take = Math.min(Math.max(limit || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(before && { cursor: { id: before }, skip: 1 }),
    });
    const page = messages.slice(0, take);
    const hasMore = messages.length > take;

    return {
      messages: page.map(toMessageResponse),
      nextCursor: hasMore ? page[page.length - 1].id : undefined,
    };
  }

  private async ensureCursorInRoom(roomId: string, messageId: string): Promise<void> {
    const cursor = await this.prisma.message.findFirst({ where: { id: messageId, roomId }, select: { id: true } });

    if (!cursor) {
      throw new InvalidArgumentRpcException("Cursor does not belong to this room");
    }
  }
}
