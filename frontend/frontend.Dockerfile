FROM node:14

WORKDIR /app

COPY package.json .
COPY tsconfig.json .

RUN npm install

# Copy app files
COPY . .

# Build the app
RUN npm run build
