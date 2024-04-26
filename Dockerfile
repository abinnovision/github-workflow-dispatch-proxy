FROM node:20.11.0-alpine as installer

WORKDIR /app

COPY . .

ARG VERSION
ENV NODE_ENV production

RUN corepack enable
RUN yarn install --immutable

RUN yarn build

# Remove all non-production dependencies
RUN yarn workspaces focus --production

FROM node:20.11.0-alpine as runner

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=installer --chown=node:node /app/dist ./dist
COPY --from=installer --chown=node:node /app/node_modules ./node_modules
COPY --from=installer --chown=node:node /app/policies ./policies

USER node
ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "/app/dist/bootstrap.js"]
