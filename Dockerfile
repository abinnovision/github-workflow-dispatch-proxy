FROM node:20.17.0-alpine as builder

WORKDIR /app

COPY . .

ARG VERSION
ENV NODE_ENV production

RUN corepack enable

RUN --mount=type=secret,id=NPM_ABINNOVISION_AUTH_TOKEN,target=/run/secrets/NPM_ABINNOVISION_AUTH_TOKEN \
    yarn config set -H --json npmScopes '{"abinnovision": {"npmPublishRegistry": "https://npm.pkg.github.com", "npmRegistryServer": "https://npm.pkg.github.com", "npmAlwaysAuth": true, "npmAuthToken": "'"$(cat /run/secrets/NPM_ABINNOVISION_AUTH_TOKEN)"'"}}'

RUN yarn install --immutable

RUN yarn build

FROM node:20.17.0-alpine as runner

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist ./

USER node
ENV NODE_ENV production

EXPOSE 8080
CMD ["node", "./src/bootstrap.js"]
