FROM node:20.17.0-alpine AS builder

WORKDIR /app

COPY . .

ARG VERSION
ENV NODE_ENV production

RUN corepack enable

RUN --mount=type=secret,id=NPM_ABINNOVISION_AUTH_TOKEN,target=/run/secrets/NPM_ABINNOVISION_AUTH_TOKEN \
    yarn config set -H --json npmScopes '{"abinnovision": {"npmPublishRegistry": "https://npm.pkg.github.com", "npmRegistryServer": "https://npm.pkg.github.com", "npmAlwaysAuth": true, "npmAuthToken": "'"$(cat /run/secrets/NPM_ABINNOVISION_AUTH_TOKEN)"'"}}'

# Install all dependencies and build the project.
RUN yarn install --immutable
RUN yarn build

# Install only production dependencies.
RUN yarn workspaces focus --production

FROM node:20.17.0-alpine AS runner
WORKDIR /app

COPY --from=builder --chown=node:node /app/dist ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

USER node
ENV NODE_ENV production

EXPOSE 8080
CMD ["node", "./src/bootstrap.js"]
