import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { ConfigService } from "../config/index.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { TokenService } from "./token.service.js";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.jwt.secret }),
    }),
  ],
  providers: [TokenService, JwtAuthGuard],
  exports: [TokenService, JwtAuthGuard],
})
export class SecurityModule {}
