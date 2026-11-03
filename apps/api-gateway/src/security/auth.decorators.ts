import { RequestUser } from "@app/common";
import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";

import { AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard.js";

export function Auth(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: "Invalid or missing access token" }),
  );
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
