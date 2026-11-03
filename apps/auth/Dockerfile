FROM node:22-alpine AS build

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY proto ./proto
COPY libs ./libs
COPY apps/auth ./apps/auth

RUN npx prisma generate --config apps/auth/prisma.config.ts && npx nest build auth

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY proto ./proto
COPY apps/auth/prisma.config.ts ./apps/auth/prisma.config.ts
COPY apps/auth/prisma ./apps/auth/prisma
COPY --from=build /opt/app/dist/apps/auth ./dist/apps/auth

USER node

EXPOSE 50051

CMD ["sh", "-c", "for i in 1 2 3 4 5 6 7 8 9 10; do npx prisma migrate deploy --config apps/auth/prisma.config.ts && exec node dist/apps/auth/main.js; sleep 2; done; exit 1"]
