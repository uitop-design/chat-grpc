import { Module } from "@nestjs/common";

import { EventsModule } from "../events/index.js";
import { MessagesModule } from "../messages/index.js";
import { RoomsModule } from "../rooms/index.js";
import { ChatController } from "./chat.controller.js";

@Module({
  imports: [EventsModule, RoomsModule, MessagesModule],
  controllers: [ChatController],
})
export class ChatModule {}
