FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY ./prisma/schema.prisma ./prisma/schema.prisma

RUN npm run prisma:generate

COPY . .

RUN npm run build

FROM node:18

WORKDIR /app

COPY ./package.json ./package-lock.json ./
COPY ./prisma ./prisma

COPY --from=build /app/build ./

RUN npm i --production

CMD [ "node", "index.js" ]