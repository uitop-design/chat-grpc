import { status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";

export class GrpcRpcException extends RpcException {
  constructor(code: status, message: string) {
    super({ code, message });
  }
}

export class NotFoundRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.NOT_FOUND, message);
  }
}

export class AlreadyExistsRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.ALREADY_EXISTS, message);
  }
}

export class PermissionDeniedRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.PERMISSION_DENIED, message);
  }
}

export class UnauthenticatedRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.UNAUTHENTICATED, message);
  }
}

export class InvalidArgumentRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.INVALID_ARGUMENT, message);
  }
}

export class FailedPreconditionRpcException extends GrpcRpcException {
  constructor(message: string) {
    super(status.FAILED_PRECONDITION, message);
  }
}
