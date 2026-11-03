import { RequestUser } from "@app/common";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

interface AccessTokenPayload {
  sub: string;
  username: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async verify(token: string | undefined): Promise<RequestUser | null> {
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      return payload.sub && payload.username ? { id: payload.sub, username: payload.username } : null;
    } catch {
      return null;
    }
  }

  extractBearer(header: string | undefined): string | undefined {
    const [scheme, token] = header?.split(" ") ?? [];

    return scheme?.toLowerCase() === "bearer" ? token : undefined;
  }
}
