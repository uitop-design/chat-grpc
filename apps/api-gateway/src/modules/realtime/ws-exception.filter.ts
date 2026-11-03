import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

import { ErrorPayload } from "../../grpc/index.js";

type Ack = (response: { error: ErrorPayload }) => void;

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const error = this.toPayload(exception);
    const ack = host.getArgs().find((arg): arg is Ack => typeof arg === "function");

    if (ack) {
      ack({ error });
      return;
    }

    host.switchToWs().getClient<Socket>().emit("exception", error);
  }

  private toPayload(exception: unknown): ErrorPayload {
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), message: exception.message };
    }

    if (exception instanceof WsException) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message };
    }

    this.logger.error(exception);

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" };
  }
}
