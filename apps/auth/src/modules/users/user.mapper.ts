import { auth } from "@app/contracts";

import { User } from "../../generated/prisma/client.js";

export function toUserResponse(user: User): auth.User {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
}
