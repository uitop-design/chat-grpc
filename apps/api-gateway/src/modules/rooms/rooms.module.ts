import { Module } from "@nestjs/common";

import { MessagesController } from "./messages.controller.js";
import { RoomsController } from "./rooms.controller.js";

@Module({
  controllers: [RoomsController, MessagesController],
})
export class RoomsModule {}
