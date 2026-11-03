import { createUserMetadata, type RequestUser } from "@app/common";
import type { chat } from "@app/contracts";
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Observable } from "rxjs";

import { CHAT_SERVICE } from "../../grpc/index.js";
import { Auth, CurrentUser } from "../../security/index.js";
import { CreateRoomDto, LeaveRoomResponseDto, ListRoomsQueryDto, ListRoomsResponseDto, RoomDto } from "./dto/index.js";

@ApiTags("rooms")
@Auth()
@Controller("rooms")
export class RoomsController {
  constructor(@Inject(CHAT_SERVICE) private readonly chatService: chat.ChatServiceClient) {}

  @Get()
  @ApiOkResponse({ type: ListRoomsResponseDto })
  list(@Query() query: ListRoomsQueryDto, @CurrentUser() user: RequestUser): Observable<ListRoomsResponseDto> {
    return this.chatService.listRooms({ joinedOnly: query.joinedOnly ?? false }, createUserMetadata(user));
  }

  @Post()
  @ApiCreatedResponse({ type: RoomDto, description: "Room is created and the creator joins it" })
  @ApiConflictResponse({ description: "Room name is already taken" })
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: RequestUser): Observable<RoomDto> {
    return this.chatService.createRoom(dto, createUserMetadata(user));
  }

  @Post(":roomId/join")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RoomDto })
  @ApiNotFoundResponse({ description: "Room not found" })
  join(@Param("roomId", ParseUUIDPipe) roomId: string, @CurrentUser() user: RequestUser): Observable<RoomDto> {
    return this.chatService.joinRoom({ roomId }, createUserMetadata(user));
  }

  @Post(":roomId/leave")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LeaveRoomResponseDto })
  @ApiNotFoundResponse({ description: "Room not found" })
  @ApiBadRequestResponse({ description: "User is not a member of the room" })
  leave(@Param("roomId", ParseUUIDPipe) roomId: string, @CurrentUser() user: RequestUser): Observable<LeaveRoomResponseDto> {
    return this.chatService.leaveRoom({ roomId }, createUserMetadata(user));
  }
}
