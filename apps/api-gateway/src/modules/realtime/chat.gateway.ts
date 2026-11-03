import { createUserMetadata, RequestUser } from "@app/common";
import type { chat } from "@app/contracts";
import { HttpStatus, Inject, Logger, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { firstValueFrom, Subscription } from "rxjs";
import { DefaultEventsMap, Namespace, Socket } from "socket.io";

import { CHAT_SERVICE, ErrorPayload, isGrpcServiceError, toErrorPayload } from "../../grpc/index.js";
import { TokenService } from "../../security/index.js";
import { RealtimeSendMessageDto, RoomSubscriptionDto } from "./dto/realtime.dto.js";
import { WsExceptionFilter } from "./ws-exception.filter.js";

interface SocketData {
  user: RequestUser;
  subscriptions: Map<string, Subscription>;
}

type ChatSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

export const ChatEvents = {
  Subscribe: "room:subscribe",
  Unsubscribe: "room:unsubscribe",
  SendMessage: "message:send",
  NewMessage: "message:new",
  StreamError: "room:error",
  StreamClosed: "room:closed",
} as const;

@WebSocketGateway({ namespace: "chat" })
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayInit<Namespace>, OnGatewayDisconnect<ChatSocket> {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly tokenService: TokenService,
    @Inject(CHAT_SERVICE) private readonly chatService: chat.ChatServiceClient,
  ) {}

  afterInit(namespace: Namespace): void {
    namespace.use((socket, next) => {
      const token = socket.handshake.auth?.token ?? this.tokenService.extractBearer(socket.handshake.headers.authorization);

      this.tokenService
        .verify(token)
        .then((user) => {
          if (!user) {
            return next(new Error("Unauthorized"));
          }

          socket.data = { user, subscriptions: new Map() } satisfies SocketData;
          return next();
        })
        .catch(next);
    });
  }

  handleDisconnect(client: ChatSocket): void {
    client.data.subscriptions?.forEach((subscription) => subscription.unsubscribe());
    client.data.subscriptions?.clear();
  }

  @SubscribeMessage(ChatEvents.Subscribe)
  subscribe(@ConnectedSocket() client: ChatSocket, @MessageBody() { roomId }: RoomSubscriptionDto): RoomSubscriptionDto {
    const { user, subscriptions } = client.data;

    if (subscriptions.has(roomId)) {
      return { roomId };
    }

    const subscription = this.chatService.subscribeRoom({ roomId }, createUserMetadata(user)).subscribe({
      next: (message) => client.emit(ChatEvents.NewMessage, message),
      error: (error: unknown) => {
        subscriptions.delete(roomId);
        client.emit(ChatEvents.StreamError, { roomId, ...this.toStreamError(error) });
      },
      complete: () => {
        subscriptions.delete(roomId);
        client.emit(ChatEvents.StreamClosed, { roomId });
      },
    });

    if (!subscription.closed) {
      subscriptions.set(roomId, subscription);
    }

    return { roomId };
  }

  @SubscribeMessage(ChatEvents.Unsubscribe)
  unsubscribe(@ConnectedSocket() client: ChatSocket, @MessageBody() { roomId }: RoomSubscriptionDto): RoomSubscriptionDto {
    client.data.subscriptions.get(roomId)?.unsubscribe();
    client.data.subscriptions.delete(roomId);

    return { roomId };
  }

  @SubscribeMessage(ChatEvents.SendMessage)
  sendMessage(@ConnectedSocket() client: ChatSocket, @MessageBody() dto: RealtimeSendMessageDto): Promise<chat.Message> {
    return firstValueFrom(
      this.chatService.sendMessage({ roomId: dto.roomId, content: dto.content }, createUserMetadata(client.data.user)),
    );
  }

  private toStreamError(error: unknown): ErrorPayload {
    if (isGrpcServiceError(error)) {
      const payload = toErrorPayload(error);

      if (payload.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`Room stream failed with gRPC code ${error.code}: ${error.details}`);
      }

      return payload;
    }

    this.logger.error(error);

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" };
  }
}
