FROM node:20.11.0-alpine as builder

WORKDIR /app

COPY . .

ARG VERSION
ENV NODE_ENV production

RUN corepack enable
RUN yarn install --immutable

RUN yarn build

FROM node:20.11.0-alpine as runner

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist ./dist

USER node
ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "/app/dist/bootstrap.js"]
