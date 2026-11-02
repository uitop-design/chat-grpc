import { grpcOptions, loadEnv, PrismaRpcExceptionFilter } from "@app/common";
import { chat, CHAT_PROTO_PATH } from "@app/contracts";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AsyncMicroserviceOptions } from "@nestjs/microservices";

import { AppModule } from "./app.module.js";
import { ConfigService } from "./config/index.js";

async function bootstrap(): Promise<void> {
  loadEnv("chat");

  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(AppModule, {
    inject: [ConfigService],
    useFactory: (config: ConfigService) => grpcOptions(chat.CHAT_PACKAGE_NAME, CHAT_PROTO_PATH, config.grpc.url),
  });

  app.useGlobalFilters(new PrismaRpcExceptionFilter());
  app.enableShutdownHooks();

  await app.listen();

  Logger.log(`Chat service is listening on ${app.get(ConfigService).grpc.url}`, "Bootstrap");
}

await bootstrap();
