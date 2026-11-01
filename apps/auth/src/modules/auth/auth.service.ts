import {
  AlreadyExistsRpcException,
  InvalidArgumentRpcException,
  isPrismaError,
  NotFoundRpcException,
  PASSWORD_MAX_BYTES,
  PrismaErrorCode,
  UnauthenticatedRpcException,
} from "@app/common";
import { auth } from "@app/contracts";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";

import { User } from "../../generated/prisma/client.js";
import { toUserResponse, UsersService } from "../users/index.js";

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly dummyPasswordHash = bcrypt.hashSync("dummy-password", PASSWORD_SALT_ROUNDS);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ username, password }: auth.RegisterRequest): Promise<auth.AuthResponse> {
    if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
      throw new InvalidArgumentRpcException(`Password must not exceed ${PASSWORD_MAX_BYTES} bytes`);
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    try {
      const user = await this.usersService.create(username, passwordHash);

      return await this.issueToken(user);
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.UniqueConstraint)) {
        throw new AlreadyExistsRpcException("Username is already taken");
      }

      throw error;
    }
  }

  async login({ username, password }: auth.LoginRequest): Promise<auth.AuthResponse> {
    const user = await this.usersService.findByUsername(username);
    const isPasswordValid = await bcrypt.compare(password, user?.passwordHash ?? this.dummyPasswordHash);

    if (!user || !isPasswordValid) {
      throw new UnauthenticatedRpcException("Invalid username or password");
    }

    return this.issueToken(user);
  }

  async getMe(userId: string): Promise<auth.User> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundRpcException("User not found");
    }

    return toUserResponse(user);
  }

  private async issueToken(user: User): Promise<auth.AuthResponse> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, username: user.username });

    return { accessToken, user: toUserResponse(user) };
  }
}
