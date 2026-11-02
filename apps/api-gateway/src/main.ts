import { loadEnv } from "@app/common";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module.js";
import { ConfigService } from "./config/index.js";
import { GrpcErrorInterceptor } from "./grpc/index.js";
import { SocketIoAdapter } from "./modules/realtime/index.js";
import { setupSwagger, SWAGGER_PATH } from "./swagger.js";
import { createValidationPipe } from "./validation/index.js";

async function bootstrap(): Promise<void> {
  loadEnv("api-gateway");

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.app.corsOrigin });
  app.useWebSocketAdapter(new SocketIoAdapter(app, config.app.corsOrigin));
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new GrpcErrorInterceptor());
  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(config.app.port, "0.0.0.0");

  Logger.log(`API gateway is listening on port ${config.app.port}`, "Bootstrap");
  Logger.log(`Swagger UI: http://localhost:${config.app.port}/${SWAGGER_PATH}`, "Bootstrap");
}

await bootstrap();
