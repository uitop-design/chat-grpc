import { createUserMetadata, type RequestUser } from "@app/common";
import type { chat } from "@app/contracts";
import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Observable } from "rxjs";

import { CHAT_SERVICE } from "../../grpc/index.js";
import { Auth, CurrentUser } from "../../security/index.js";
import { ListMessagesQueryDto, ListMessagesResponseDto, MessageDto, SendMessageDto } from "./dto/index.js";

@ApiTags("messages")
@Auth()
@ApiForbiddenResponse({ description: "User is not a member of the room" })
@ApiNotFoundResponse({ description: "Room not found" })
@Controller("rooms/:roomId/messages")
export class MessagesController {
  constructor(@Inject(CHAT_SERVICE) private readonly chatService: chat.ChatServiceClient) {}

  @Get()
  @ApiOkResponse({ type: ListMessagesResponseDto })
  list(
    @Param("roomId", ParseUUIDPipe) roomId: string,
    @Query() query: ListMessagesQueryDto,
    @CurrentUser() user: RequestUser,
  ): Observable<ListMessagesResponseDto> {
    return this.chatService.listMessages({ roomId, limit: query.limit ?? 0, before: query.before }, createUserMetadata(user));
  }

  @Post()
  @ApiCreatedResponse({ type: MessageDto, description: "Message is stored and pushed to room subscribers" })
  send(
    @Param("roomId", ParseUUIDPipe) roomId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: RequestUser,
  ): Observable<MessageDto> {
    return this.chatService.sendMessage({ roomId, content: dto.content }, createUserMetadata(user));
  }
}
