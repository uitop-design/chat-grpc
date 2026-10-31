import { Metadata } from "@grpc/grpc-js";

import { UnauthenticatedRpcException } from "../exceptions/index.js";

export const USER_ID_METADATA_KEY = "x-user-id";
export const USERNAME_METADATA_KEY = "x-username";

export interface RequestUser {
  id: string;
  username: string;
}

export function createUserMetadata(user: RequestUser): Metadata {
  const metadata = new Metadata();
  metadata.set(USER_ID_METADATA_KEY, user.id);
  metadata.set(USERNAME_METADATA_KEY, encodeURIComponent(user.username));
  return metadata;
}

export function getUserFromMetadata(metadata?: Metadata): RequestUser {
  const [id] = metadata?.get(USER_ID_METADATA_KEY) ?? [];
  const [username] = metadata?.get(USERNAME_METADATA_KEY) ?? [];

  if (typeof id !== "string" || !id || typeof username !== "string" || !username) {
    throw new UnauthenticatedRpcException("User context is missing");
  }

  return { id, username: decodeURIComponent(username) };
}
