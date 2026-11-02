import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const SWAGGER_PATH = "docs";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Chat gRPC API Gateway")
    .setDescription(
      "REST entry point of the chat. Every call is forwarded to the auth or chat microservice over gRPC. " +
        "Live messages are delivered over Socket.IO, namespace /chat (see README).",
    )
    .setVersion("1.0.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
  });
}
