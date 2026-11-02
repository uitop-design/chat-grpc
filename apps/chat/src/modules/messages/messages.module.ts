import { Module } from "@nestjs/common";

import { EventsModule } from "../events/index.js";
import { RoomsModule } from "../rooms/index.js";
import { MessagesService } from "./messages.service.js";

@Module({
  imports: [EventsModule, RoomsModule],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
