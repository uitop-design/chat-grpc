import { createUserMetadata, type RequestUser } from "@app/common";
import type { auth } from "@app/contracts";
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Observable } from "rxjs";

import { AUTH_SERVICE } from "../../grpc/index.js";
import { Auth, CurrentUser } from "../../security/index.js";
import { AuthResponseDto, LoginDto, RegisterDto, UserDto } from "./dto/index.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: auth.AuthServiceClient) {}

  @Post("register")
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: "Username is already taken" })
  register(@Body() dto: RegisterDto): Observable<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "Invalid username or password" })
  login(@Body() dto: LoginDto): Observable<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get("me")
  @Auth()
  @ApiOkResponse({ type: UserDto })
  me(@CurrentUser() user: RequestUser): Observable<UserDto> {
    return this.authService.getMe({}, createUserMetadata(user));
  }
}
