import { chat } from "@app/contracts";
import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { filter, map, Observable, Subject, takeWhile } from "rxjs";

interface MessageCreatedEvent {
  type: "message-created";
  message: chat.Message;
}

interface MemberLeftEvent {
  type: "member-left";
  userId: string;
}

type RoomEvent = MessageCreatedEvent | MemberLeftEvent;

@Injectable()
export class RoomEventsService implements OnApplicationShutdown {
  private readonly rooms = new Map<string, Subject<RoomEvent>>();

  publishMessage(message: chat.Message): void {
    this.rooms.get(message.roomId)?.next({ type: "message-created", message });
  }

  publishMemberLeft(roomId: string, userId: string): void {
    this.rooms.get(roomId)?.next({ type: "member-left", userId });
  }

  roomMessages(roomId: string, userId: string): Observable<chat.Message> {
    return new Observable<chat.Message>((subscriber) => {
      const room$ = this.getRoom(roomId);
      const subscription = room$
        .pipe(
          takeWhile((event) => !(event.type === "member-left" && event.userId === userId)),
          filter((event): event is MessageCreatedEvent => event.type === "message-created"),
          map((event) => event.message),
        )
        .subscribe(subscriber);

      return () => {
        subscription.unsubscribe();

        if (!room$.observed) {
          this.rooms.delete(roomId);
        }
      };
    });
  }

  onApplicationShutdown(): void {
    this.rooms.forEach((room$) => room$.complete());
    this.rooms.clear();
  }

  private getRoom(roomId: string): Subject<RoomEvent> {
    let room$ = this.rooms.get(roomId);

    if (!room$) {
      room$ = new Subject<RoomEvent>();
      this.rooms.set(roomId, room$);
    }

    return room$;
  }
}
