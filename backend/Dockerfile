FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY seed-data.json ./
COPY tsconfig.json ./

COPY src ./src

EXPOSE 5000

CMD ["npm", "run", "dev"]
