import { Module } from "@nestjs/common";

import { RoomEventsService } from "./room-events.service.js";

@Module({
  providers: [RoomEventsService],
  exports: [RoomEventsService],
})
export class EventsModule {}
