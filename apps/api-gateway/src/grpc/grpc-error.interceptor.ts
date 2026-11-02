import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, throwError } from "rxjs";

import { isGrpcServiceError, toHttpException } from "./grpc-error.mapper.js";

@Injectable()
export class GrpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcErrorInterceptor.name);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(catchError((error: unknown) => throwError(() => this.translate(error))));
  }

  private translate(error: unknown): unknown {
    if (!isGrpcServiceError(error)) {
      return error;
    }

    const exception = toHttpException(error);

    if (exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`gRPC call failed with code ${error.code}: ${error.details}`);
    }

    return exception;
  }
}
