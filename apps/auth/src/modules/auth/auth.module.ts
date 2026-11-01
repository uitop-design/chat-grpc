import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { ConfigService } from "../../config/index.js";
import { UsersModule } from "../users/index.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresInSeconds },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
