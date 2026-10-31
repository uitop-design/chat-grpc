import { status } from "@grpc/grpc-js";
import { ArgumentsHost, Catch } from "@nestjs/common";
import { BaseRpcExceptionFilter } from "@nestjs/microservices";
import { Observable } from "rxjs";

import { GrpcRpcException } from "../exceptions/index.js";
import { getPrismaErrorCode, PrismaErrorCode } from "./prisma-error.js";

const PRISMA_ERRORS: Record<string, { code: status; message: string }> = {
  [PrismaErrorCode.UniqueConstraint]: { code: status.ALREADY_EXISTS, message: "Resource already exists" },
  [PrismaErrorCode.ForeignKeyConstraint]: { code: status.FAILED_PRECONDITION, message: "Related resource does not exist" },
  [PrismaErrorCode.RecordNotFound]: { code: status.NOT_FOUND, message: "Resource not found" },
};

@Catch()
export class PrismaRpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<unknown> {
    const prismaError = PRISMA_ERRORS[getPrismaErrorCode(exception) ?? ""];

    if (prismaError) {
      return super.catch(new GrpcRpcException(prismaError.code, prismaError.message), host);
    }

    return super.catch(exception, host);
  }
}
