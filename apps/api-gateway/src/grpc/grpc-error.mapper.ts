import { ServiceError, status } from "@grpc/grpc-js";
import { HttpException, HttpStatus } from "@nestjs/common";

const GRPC_TO_HTTP_STATUS: Partial<Record<status, HttpStatus>> = {
  [status.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [status.FAILED_PRECONDITION]: HttpStatus.BAD_REQUEST,
  [status.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
  [status.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [status.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [status.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [status.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [status.ABORTED]: HttpStatus.CONFLICT,
  [status.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [status.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
  [status.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [status.CANCELLED]: HttpStatus.SERVICE_UNAVAILABLE,
  [status.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
};

const EXPOSED_SERVER_ERRORS = new Set<status>([
  status.UNAVAILABLE,
  status.CANCELLED,
  status.DEADLINE_EXCEEDED,
  status.UNIMPLEMENTED,
]);

export interface ErrorPayload {
  status: HttpStatus;
  message: string;
}

export function isGrpcServiceError(error: unknown): error is ServiceError {
  return typeof error === "object" && error !== null && typeof (error as ServiceError).code === "number" && "details" in error;
}

export function toErrorPayload(error: ServiceError): ErrorPayload {
  const httpStatus = GRPC_TO_HTTP_STATUS[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  const isClientError = httpStatus < HttpStatus.INTERNAL_SERVER_ERROR;

  if (isClientError) {
    return { status: httpStatus, message: error.details };
  }

  if (EXPOSED_SERVER_ERRORS.has(error.code)) {
    return { status: httpStatus, message: "Upstream service is unavailable" };
  }

  return { status: httpStatus, message: "Internal server error" };
}

export function toHttpException(error: ServiceError): HttpException {
  const payload = toErrorPayload(error);

  return new HttpException(payload, payload.status);
}
