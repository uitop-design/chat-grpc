import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/index.js";
import { DatabaseModule } from "./database/index.js";
import { ChatModule } from "./modules/chat/index.js";

@Module({
  imports: [ConfigModule, DatabaseModule, ChatModule],
})
export class AppModule {}
