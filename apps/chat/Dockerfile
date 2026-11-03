FROM node:22-alpine AS build

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY proto ./proto
COPY libs ./libs
COPY apps/chat ./apps/chat

RUN npx prisma generate --config apps/chat/prisma.config.ts && npx nest build chat

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY proto ./proto
COPY apps/chat/prisma.config.ts ./apps/chat/prisma.config.ts
COPY apps/chat/prisma ./apps/chat/prisma
COPY --from=build /opt/app/dist/apps/chat ./dist/apps/chat

USER node

EXPOSE 50052

CMD ["sh", "-c", "for i in 1 2 3 4 5 6 7 8 9 10; do npx prisma migrate deploy --config apps/chat/prisma.config.ts && exec node dist/apps/chat/main.js; sleep 2; done; exit 1"]
