import { ROOM_NAME_MAX_LENGTH } from "@app/common";
import { chat } from "@app/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

const BOOLEAN_QUERY_VALUES = new Map<unknown, boolean>([
  ["true", true],
  ["false", false],
]);

export class CreateRoomDto implements chat.CreateRoomRequest {
  @ApiProperty({ example: "general", minLength: 1, maxLength: ROOM_NAME_MAX_LENGTH })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, ROOM_NAME_MAX_LENGTH)
  name: string;
}

export class ListRoomsQueryDto {
  @ApiPropertyOptional({ description: "Return only rooms the current user has joined", default: false })
  @Transform(({ value }) => BOOLEAN_QUERY_VALUES.get(value) ?? value)
  @IsOptional()
  @IsBoolean()
  joinedOnly?: boolean;
}

export class RoomDto implements chat.Room {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "general" })
  name: string;

  @ApiProperty({ format: "uuid" })
  ownerId: string;

  @ApiProperty({ example: 3 })
  memberCount: number;

  @ApiProperty({ description: "Whether the current user is a member of the room" })
  joined: boolean;

  @ApiProperty({ format: "date-time" })
  createdAt: string;
}

export class ListRoomsResponseDto implements chat.ListRoomsResponse {
  @ApiProperty({ type: [RoomDto] })
  rooms: RoomDto[];
}

export class LeaveRoomResponseDto implements chat.LeaveRoomResponse {
  @ApiProperty({ format: "uuid" })
  roomId: string;
}
