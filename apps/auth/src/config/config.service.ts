import { AbstractConfig } from "@app/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ConfigService extends AbstractConfig {
  readonly grpc = {
    url: this.getString("GRPC_URL", "0.0.0.0:50051"),
  };

  readonly database = {
    url: this.getString("DATABASE_URL"),
  };

  readonly jwt = {
    secret: this.getSecret("JWT_SECRET"),
    expiresInSeconds: this.getNumber("JWT_EXPIRES_IN_SECONDS", 86400),
  };
}
