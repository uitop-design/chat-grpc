import { getUserFromMetadata } from "@app/common";
import { chat } from "@app/contracts";
import { Metadata } from "@grpc/grpc-js";
import { Controller } from "@nestjs/common";
import { defer, finalize, from, Observable, ReplaySubject, switchMap } from "rxjs";

import { RoomEventsService } from "../events/index.js";
import { MessagesService } from "../messages/index.js";
import { RoomsService } from "../rooms/index.js";

@Controller()
@chat.ChatServiceControllerMethods()
export class ChatController implements chat.ChatServiceController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
    private readonly roomEvents: RoomEventsService,
  ) {}

  createRoom(request: chat.CreateRoomRequest, metadata?: Metadata): Promise<chat.Room> {
    return this.roomsService.create(request.name, getUserFromMetadata(metadata).id);
  }

  async listRooms(request: chat.ListRoomsRequest, metadata?: Metadata): Promise<chat.ListRoomsResponse> {
    const rooms = await this.roomsService.list(getUserFromMetadata(metadata).id, request.joinedOnly);

    return { rooms };
  }

  joinRoom(request: chat.RoomRequest, metadata?: Metadata): Promise<chat.Room> {
    return this.roomsService.join(request.roomId, getUserFromMetadata(metadata).id);
  }

  leaveRoom(request: chat.RoomRequest, metadata?: Metadata): Promise<chat.LeaveRoomResponse> {
    return this.roomsService.leave(request.roomId, getUserFromMetadata(metadata).id);
  }

  sendMessage(request: chat.SendMessageRequest, metadata?: Metadata): Promise<chat.Message> {
    return this.messagesService.send(request, getUserFromMetadata(metadata));
  }

  listMessages(request: chat.ListMessagesRequest, metadata?: Metadata): Promise<chat.ListMessagesResponse> {
    return this.messagesService.list(request, getUserFromMetadata(metadata).id);
  }

  subscribeRoom(request: chat.RoomRequest, metadata?: Metadata): Observable<chat.Message> {
    return defer(() => {
      const user = getUserFromMetadata(metadata);
      const pending$ = new ReplaySubject<chat.Message>();
      const subscription = this.roomEvents.roomMessages(request.roomId, user.id).subscribe(pending$);

      return from(this.roomsService.ensureMember(request.roomId, user.id)).pipe(
        switchMap(() => pending$),
        finalize(() => subscription.unsubscribe()),
      );
    });
  }
}
