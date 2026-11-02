import { grpcOptions } from "@app/common";
import { auth, AUTH_PROTO_PATH, chat, CHAT_PROTO_PATH } from "@app/contracts";
import { Global, Module } from "@nestjs/common";
import { ClientGrpc, ClientsModule } from "@nestjs/microservices";

import { ConfigService } from "../config/index.js";
import { AUTH_CLIENT, AUTH_SERVICE, CHAT_CLIENT, CHAT_SERVICE } from "./grpc.tokens.js";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => grpcOptions(auth.AUTH_PACKAGE_NAME, AUTH_PROTO_PATH, config.grpc.authUrl),
      },
      {
        name: CHAT_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => grpcOptions(chat.CHAT_PACKAGE_NAME, CHAT_PROTO_PATH, config.grpc.chatUrl),
      },
    ]),
  ],
  providers: [
    {
      provide: AUTH_SERVICE,
      inject: [AUTH_CLIENT],
      useFactory: (client: ClientGrpc) => client.getService<auth.AuthServiceClient>(auth.AUTH_SERVICE_NAME),
    },
    {
      provide: CHAT_SERVICE,
      inject: [CHAT_CLIENT],
      useFactory: (client: ClientGrpc) => client.getService<chat.ChatServiceClient>(chat.CHAT_SERVICE_NAME),
    },
  ],
  exports: [AUTH_SERVICE, CHAT_SERVICE],
})
export class GrpcClientsModule {}
