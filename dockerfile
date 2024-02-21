FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY ./prisma/schema.prisma ./prisma/schema.prisma

RUN npm run prisma:generate

COPY . .

RUN npm run build

FROM node:18 AS prod

WORKDIR /app

COPY ./package.json ./
COPY ./prisma ./prisma

COPY --from=build /app/build ./

RUN npm install --omit=dev

CMD [ "node", "index.js" ]