import { join } from "node:path";

const PROTO_DIR = join(process.cwd(), "proto");

export const AUTH_PROTO_PATH = join(PROTO_DIR, "auth.proto");
export const CHAT_PROTO_PATH = join(PROTO_DIR, "chat.proto");
