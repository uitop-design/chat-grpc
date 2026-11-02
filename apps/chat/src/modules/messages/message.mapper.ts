import { chat } from "@app/contracts";

import { Message } from "../../generated/prisma/client.js";

export function toMessageResponse(message: Message): chat.Message {
  return {
    id: message.id,
    roomId: message.roomId,
    authorId: message.authorId,
    authorName: message.authorName,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
