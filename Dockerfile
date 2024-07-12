# Stage 1: Build stage
ARG NODE_VERSION=22.2.0
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Production stage
FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY . .

USER node

CMD ["npm", "run-script", "dev"]
