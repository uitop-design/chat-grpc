import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@app/common";
import { auth } from "@app/contracts";
import { ApiProperty } from "@nestjs/swagger";
import { IsByteLength, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto implements auth.RegisterRequest {
  @ApiProperty({ example: "alice", description: "3-32 characters: letters, digits, dot, dash, underscore" })
  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]{3,32}$/, { message: "username must be 3-32 characters: letters, digits, dot, dash, underscore" })
  username: string;

  @ApiProperty({
    example: "s3cret-password",
    minLength: PASSWORD_MIN_LENGTH,
    description: `At least ${PASSWORD_MIN_LENGTH} characters and at most ${PASSWORD_MAX_BYTES} bytes in UTF-8`,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: `password must not exceed ${PASSWORD_MAX_BYTES} bytes` })
  password: string;
}

export class LoginDto implements auth.LoginRequest {
  @ApiProperty({ example: "alice" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "s3cret-password" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
