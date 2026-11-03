import { RequestUser } from "@app/common";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { TokenService } from "./token.service.js";

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.tokenService.verify(this.tokenService.extractBearer(request.headers.authorization));

    if (!user) {
      throw new UnauthorizedException("Invalid or missing access token");
    }

    request.user = user;

    return true;
  }
}
