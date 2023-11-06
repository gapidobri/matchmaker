FROM node:alpine as base

WORKDIR /usr/src/app

RUN if [[ $(uname -m) == "aarch64" ]] ; \
    then \
    # aarch64
    wget https://raw.githubusercontent.com/squishyu/alpine-pkg-glibc-aarch64-bin/master/glibc-2.26-r1.apk ; \
    apk add --no-cache --allow-untrusted --force-overwrite glibc-2.26-r1.apk ; \
    rm glibc-2.26-r1.apk ; \
    else \
    # x86_64
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk ; \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub ; \
    apk add --no-cache --force-overwrite glibc-2.28-r0.apk ; \
    rm glibc-2.28-r0.apk ; \
    fi

RUN npm install -g bun

FROM base as build

RUN bun i -g turbo

COPY package.json ./
COPY bun.lockb ./

COPY apps/app/package.json ./apps/app/package.json
# Temporary
COPY packages ./packages

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate --schema=./apps/app/prisma/schema.prisma

RUN bun run build --filter=app...

FROM base

RUN bun i -g prisma

COPY --from=build /usr/src/app/apps/app/build ./
COPY --from=build /usr/src/app/apps/app/package.json ./package.json
COPY --from=build /usr/src/app/apps/app/node_modules ./node_modules
COPY --from=build /usr/src/app/apps/app/prisma ./prisma

CMD ["bun", "index.js"]