import { Module } from "@nestjs/common";

import { EventsModule } from "../events/index.js";
import { RoomsService } from "./rooms.service.js";

@Module({
  imports: [EventsModule],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
