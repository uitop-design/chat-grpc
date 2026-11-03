# chat-grpc

A small rooms chat built as a set of NestJS microservices that talk to each other over gRPC.
Users register, create rooms, join and leave them, send messages and receive new ones in real time.

The goal of the project is to show a clean microservice setup: a single public API gateway,
independent services with their own databases, typed `.proto` contracts, and server-streaming
gRPC for live delivery.

## Architecture

```
                 HTTP (REST + Swagger)
   client  ───────────────────────────────►  ┌──────────────┐   gRPC   ┌──────────┐     ┌─────────┐
           ◄──────── Socket.IO /chat ──────  │  api-gateway │ ───────► │   auth   │ ──► │ auth-db │
                                             │   :3000      │          │  :50051  │     └─────────┘
                                             │              │   gRPC   ┌──────────┐     ┌─────────┐
                                             │              │ ───────► │   chat   │ ──► │ chat-db │
                                             └──────────────┘ ◄─stream │  :50052  │     └─────────┘
                                                                       └──────────┘
```

| Service       | Responsibility                                                                 | Transport                     | Storage            |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------- | ------------------ |
| `api-gateway` | Public entry point, JWT verification, validation, Swagger, WebSocket fan-out   | HTTP + Socket.IO → gRPC client | none               |
| `auth`        | Users, password hashing, JWT issuing                                           | gRPC server (`auth.proto`)    | PostgreSQL `auth`  |
| `chat`        | Rooms, membership, messages, live message stream                               | gRPC server (`chat.proto`)    | PostgreSQL `chat`  |

Key decisions:

- **Database per service.** `auth` and `chat` each own a separate PostgreSQL instance and a separate
  Prisma schema. No service reads another service's tables; `chat` only stores user ids it receives
  from the gateway.
- **Contracts first.** `proto/*.proto` is the single source of truth. TypeScript interfaces for clients
  and controllers are generated into `libs/contracts` with `ts-proto`, so a contract change breaks
  the build of every affected service.
- **Authentication at the edge.** `auth` issues an HS256 JWT. The gateway verifies it on every HTTP
  request and WebSocket handshake, then forwards the caller as gRPC metadata (`x-user-id`,
  `x-username`). Internal services trust that metadata and are not exposed outside the Docker network.
- **Live delivery.** The gateway opens a `ChatService.SubscribeRoom` server stream per subscribed socket
  and pushes every message to the client as a Socket.IO event. When a user leaves a room, the chat
  service completes their stream. When the socket disconnects, the gateway cancels the gRPC call.
- **Error mapping.** Services throw gRPC status codes (`NOT_FOUND`, `ALREADY_EXISTS`,
  `PERMISSION_DENIED`, …). The gateway translates them to HTTP statuses for REST and to `exception`
  events for WebSocket. Unexpected errors surface as `500 Internal server error` without internal details.
- **Denormalized author name.** A message keeps the author's username at send time, so reading history
  does not require a call to `auth`.

## Tech stack

- Node.js 22, TypeScript 6, NestJS 12 (monorepo mode, ESM, rspack builder)
- gRPC: `@grpc/grpc-js`, `@grpc/proto-loader`, `@nestjs/microservices`
- Contracts: Protocol Buffers, `buf` + `ts-proto`
- PostgreSQL 17, Prisma 7 with the `pg` driver adapter
- Socket.IO via `@nestjs/websockets`
- `class-validator` / `class-transformer`, `@nestjs/swagger`, `@nestjs/jwt`, `bcryptjs`
- Docker Compose, oxlint, Prettier

## Project structure

```
chat-grpc/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── config/            typed env config
│   │   │   ├── grpc/              gRPC clients, gRPC → HTTP error mapping
│   │   │   ├── security/          JWT verification, @Auth() and @CurrentUser()
│   │   │   ├── validation/        global ValidationPipe
│   │   │   ├── modules/
│   │   │   │   ├── auth/          /api/auth/*
│   │   │   │   ├── rooms/         /api/rooms/*, /api/rooms/:roomId/messages
│   │   │   │   └── realtime/      Socket.IO gateway (namespace /chat)
│   │   │   ├── swagger.ts
│   │   │   └── main.ts
│   │   └── Dockerfile
│   ├── auth/
│   │   ├── prisma/                schema.prisma + migrations
│   │   ├── prisma.config.ts
│   │   ├── src/
│   │   │   ├── config/  database/
│   │   │   ├── modules/auth/      gRPC controller, register/login/me
│   │   │   ├── modules/users/     user persistence
│   │   │   └── main.ts
│   │   └── Dockerfile
│   └── chat/
│       ├── prisma/                schema.prisma + migrations
│       ├── prisma.config.ts
│       ├── src/
│       │   ├── config/  database/
│       │   ├── modules/chat/      gRPC controller
│       │   ├── modules/rooms/     rooms and membership
│       │   ├── modules/messages/  messages and history
│       │   ├── modules/events/    in-process room event bus for streams
│       │   └── main.ts
│       └── Dockerfile
├── libs/
│   ├── common/                    config base, gRPC options, user metadata, RPC exceptions, Prisma RPC filter
│   └── contracts/                 generated TypeScript from proto/ + proto paths
├── proto/
│   ├── auth.proto
│   └── chat.proto
├── buf.yaml, buf.gen.yaml         proto code generation
├── docker-compose.yml
└── nest-cli.json
```

## Running with Docker Compose

Requirements: Docker with Compose v2.

```bash
cp .env.example .env
# put a random secret of at least 32 characters into .env, e.g.
# JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build
```

This starts two PostgreSQL containers, applies Prisma migrations on service start, and runs `auth`,
`chat` and `api-gateway`. Only the gateway is published to the host:

- REST API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/docs (OpenAPI JSON at http://localhost:3000/docs/json)
- WebSocket: `ws://localhost:3000/chat` (Socket.IO)

`JWT_SECRET` in the root `.env` is shared by `auth` (signing) and `api-gateway` (verification).
It has no default: Compose refuses to start without it, and both services reject secrets shorter
than 32 characters. `CORS_ORIGIN` can be set in the same file (defaults to `*`).

## Running locally

Requirements: Node.js 22.12+, npm, Docker (only for the databases).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create env files for each service. The defaults work with the Compose databases:

   ```bash
   cp apps/api-gateway/.env.example apps/api-gateway/.env
   cp apps/auth/.env.example apps/auth/.env
   cp apps/chat/.env.example apps/chat/.env
   ```

   Set the same random `JWT_SECRET` (at least 32 characters) in `apps/auth/.env` and `apps/api-gateway/.env`.

3. Start only the databases (`auth-db` on port 5433, `chat-db` on port 5434):

   ```bash
   docker compose up -d auth-db chat-db
   ```

4. Generate Prisma clients and apply migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:deploy
   ```

5. Start the services, each in its own terminal:

   ```bash
   npm run start:auth
   npm run start:chat
   npm run start:api-gateway
   ```

Swagger is then available at http://localhost:3000/docs.

### Environment variables

| Service       | Variable                 | Default                  | Description                          |
| ------------- | ------------------------ | ------------------------ | ------------------------------------ |
| `api-gateway` | `PORT`                   | `3000`                   | HTTP and WebSocket port              |
|               | `JWT_SECRET`             | required, 32+ chars      | Secret used to verify access tokens  |
|               | `AUTH_GRPC_URL`          | `localhost:50051`        | Address of the auth service          |
|               | `CHAT_GRPC_URL`          | `localhost:50052`        | Address of the chat service          |
|               | `CORS_ORIGIN`            | `*`                      | Allowed origin for REST and Socket.IO |
| `auth`        | `DATABASE_URL`           | required                 | PostgreSQL connection string         |
|               | `GRPC_URL`               | `0.0.0.0:50051`          | gRPC bind address                    |
|               | `JWT_SECRET`             | required, 32+ chars      | Secret used to sign access tokens    |
|               | `JWT_EXPIRES_IN_SECONDS` | `86400`                  | Access token lifetime                |
| `chat`        | `DATABASE_URL`           | required                 | PostgreSQL connection string         |
|               | `GRPC_URL`               | `0.0.0.0:50052`          | gRPC bind address                    |

## API

All endpoints except register and login require `Authorization: Bearer <accessToken>`.

| Method | Path                            | Description                                     |
| ------ | ------------------------------- | ----------------------------------------------- |
| POST   | `/api/auth/register`            | Create an account, returns a token              |
| POST   | `/api/auth/login`               | Log in, returns a token                         |
| GET    | `/api/auth/me`                  | Current user                                    |
| GET    | `/api/rooms?joinedOnly=true`    | List rooms (optionally only joined ones)        |
| POST   | `/api/rooms`                    | Create a room, the creator joins it             |
| POST   | `/api/rooms/:roomId/join`       | Join a room                                     |
| POST   | `/api/rooms/:roomId/leave`      | Leave a room                                    |
| GET    | `/api/rooms/:roomId/messages`   | History, newest first (`limit`, `before` cursor) |
| POST   | `/api/rooms/:roomId/messages`   | Send a message                                  |

The full schema is in Swagger.

### WebSocket events

Connect to the `/chat` namespace with the access token:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/chat", { auth: { token: accessToken } });

socket.on("message:new", (message) => console.log(message));
await socket.emitWithAck("room:subscribe", { roomId });
await socket.emitWithAck("message:send", { roomId, content: "Hello!" });
```

| Direction       | Event              | Payload                         | Notes                                                    |
| --------------- | ------------------ | ------------------------------- | -------------------------------------------------------- |
| client → server | `room:subscribe`   | `{ roomId }`                    | Start receiving messages of a joined room                |
| client → server | `room:unsubscribe` | `{ roomId }`                    | Stop receiving messages                                  |
| client → server | `message:send`     | `{ roomId, content }`           | Ack contains the stored message                          |
| server → client | `message:new`      | `Message`                       | New message in a subscribed room                         |
| server → client | `room:error`       | `{ roomId, status, message }`   | Subscription failed, e.g. `403` when not a member        |
| server → client | `room:closed`      | `{ roomId }`                    | Stream ended, e.g. after leaving the room                |
| server → client | `exception`        | `{ status, message }`           | A command sent without an ack callback failed            |

A command sent with an ack callback always gets an answer: the result on success, or
`{ error: { status, message } }` on failure, e.g. `400` for invalid payload or `403` when the user
is not a member of the room.

A handshake without a valid token is rejected with `connect_error: Unauthorized`.

## Scripts

| Script                                    | Description                                        |
| ----------------------------------------- | -------------------------------------------------- |
| `npm run build`                           | Generate Prisma clients and build all three apps   |
| `npm run build:<app>`                     | Build one app (`api-gateway`, `auth`, `chat`)      |
| `npm run start:<app>`                     | Run one app in watch mode                          |
| `npm run typecheck`                       | `tsc --noEmit` for every app                       |
| `npm run lint` / `npm run format`         | oxlint / Prettier                                  |
| `npm run proto:generate`                  | Regenerate `libs/contracts` from `proto/`          |
| `npm run prisma:generate`                 | Generate Prisma clients for `auth` and `chat`      |
| `npm run prisma:migrate:auth` / `:chat`   | Create a new migration in development              |
| `npm run prisma:deploy`                   | Apply migrations for both services                 |

## Limitations

- The room event bus in `chat` is in-process, so live delivery works with a single `chat` replica.
  Running several replicas would need a shared broker (for example NATS or Redis pub/sub).
- Service-to-service traffic uses plaintext gRPC inside the private Docker network. A production setup
  would add mTLS between services.
- There is no refresh token: the client logs in again when the access token expires.
