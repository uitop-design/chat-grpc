import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/index.js";
import { GrpcClientsModule } from "./grpc/index.js";
import { AuthModule } from "./modules/auth/index.js";
import { RealtimeModule } from "./modules/realtime/index.js";
import { RoomsModule } from "./modules/rooms/index.js";
import { SecurityModule } from "./security/index.js";

@Module({
  imports: [ConfigModule, GrpcClientsModule, SecurityModule, AuthModule, RoomsModule, RealtimeModule],
})
export class AppModule {}
