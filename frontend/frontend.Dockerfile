FROM node:14

WORKDIR /app

COPY package.json /app/
COPY tsconfig.json /app/
RUN npm install
