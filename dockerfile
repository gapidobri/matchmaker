FROM oven/bun:1.0.26-debian AS base

WORKDIR /app

COPY --from=node:18 /usr/local/bin/node /usr/local/bin/node

FROM base AS build

COPY package.json ./
COPY bun.lockb ./

RUN bun install --frozen-lockfile

COPY ./prisma/schema.prisma ./prisma/schema.prisma

RUN bun run prisma:generate

COPY . .

RUN bun run build

FROM base

COPY package.json ./
COPY bun.lockb ./

RUN bun install -p --frozen-lockfile

COPY ./prisma ./prisma
RUN bun run prisma:generate

COPY --from=build /app/build ./

RUN bun install

# RUN rm /usr/local/bin/node

CMD ["bun", "index.js"]