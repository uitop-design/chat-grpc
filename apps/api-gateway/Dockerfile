FROM node:22-alpine AS build

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY proto ./proto
COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

RUN npx nest build api-gateway

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY proto ./proto
COPY --from=build /opt/app/dist/apps/api-gateway ./dist/apps/api-gateway

USER node

EXPOSE 3000

CMD ["node", "dist/apps/api-gateway/main.js"]
