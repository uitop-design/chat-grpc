import { auth } from "@app/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class UserDto implements auth.User {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "alice" })
  username: string;

  @ApiProperty({ format: "date-time" })
  createdAt: string;
}

export class AuthResponseDto implements auth.AuthResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto | undefined;
}
