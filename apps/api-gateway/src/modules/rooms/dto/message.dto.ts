import { MESSAGE_CONTENT_MAX_LENGTH } from "@app/common";
import { chat } from "@app/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class SendMessageDto {
  @ApiProperty({ example: "Hello there!", minLength: 1, maxLength: MESSAGE_CONTENT_MAX_LENGTH })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, MESSAGE_CONTENT_MAX_LENGTH)
  content: string;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ format: "uuid", description: "Cursor: return messages older than this message id" })
  @IsOptional()
  @IsUUID()
  before?: string;
}

export class MessageDto implements chat.Message {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ format: "uuid" })
  roomId: string;

  @ApiProperty({ format: "uuid" })
  authorId: string;

  @ApiProperty({ example: "alice" })
  authorName: string;

  @ApiProperty({ example: "Hello there!" })
  content: string;

  @ApiProperty({ format: "date-time" })
  createdAt: string;
}

export class ListMessagesResponseDto implements chat.ListMessagesResponse {
  @ApiProperty({ type: [MessageDto], description: "Newest first" })
  messages: MessageDto[];

  @ApiPropertyOptional({ format: "uuid", description: "Pass as `before` to load the next page" })
  nextCursor?: string;
}
