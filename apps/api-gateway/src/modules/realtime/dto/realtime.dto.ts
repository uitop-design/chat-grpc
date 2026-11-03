import { IsUUID } from "class-validator";

import { SendMessageDto } from "../../rooms/index.js";

export class RoomSubscriptionDto {
  @IsUUID()
  roomId: string;
}

export class RealtimeSendMessageDto extends SendMessageDto {
  @IsUUID()
  roomId: string;
}
