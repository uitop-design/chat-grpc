import { AbstractConfig } from "@app/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ConfigService extends AbstractConfig {
  readonly app = {
    port: this.getNumber("PORT", 3000),
    corsOrigin: this.getString("CORS_ORIGIN", "*"),
  };

  readonly jwt = {
    secret: this.getSecret("JWT_SECRET"),
  };

  readonly grpc = {
    authUrl: this.getString("AUTH_GRPC_URL", "localhost:50051"),
    chatUrl: this.getString("CHAT_GRPC_URL", "localhost:50052"),
  };
}
