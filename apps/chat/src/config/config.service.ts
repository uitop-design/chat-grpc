import { AbstractConfig } from "@app/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ConfigService extends AbstractConfig {
  readonly grpc = {
    url: this.getString("GRPC_URL", "0.0.0.0:50052"),
  };

  readonly database = {
    url: this.getString("DATABASE_URL"),
  };
}
