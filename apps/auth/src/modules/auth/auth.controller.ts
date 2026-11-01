import { getUserFromMetadata } from "@app/common";
import { auth } from "@app/contracts";
import { Metadata } from "@grpc/grpc-js";
import { Controller } from "@nestjs/common";

import { AuthService } from "./auth.service.js";

@Controller()
@auth.AuthServiceControllerMethods()
export class AuthController implements auth.AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  register(request: auth.RegisterRequest): Promise<auth.AuthResponse> {
    return this.authService.register(request);
  }

  login(request: auth.LoginRequest): Promise<auth.AuthResponse> {
    return this.authService.login(request);
  }

  getMe(_request: auth.GetMeRequest, metadata?: Metadata): Promise<auth.User> {
    return this.authService.getMe(getUserFromMetadata(metadata).id);
  }
}
