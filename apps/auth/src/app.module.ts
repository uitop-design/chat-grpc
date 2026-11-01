import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/index.js";
import { DatabaseModule } from "./database/index.js";
import { AuthModule } from "./modules/auth/index.js";

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
})
export class AppModule {}
