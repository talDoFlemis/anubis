# Stage 1: Install dependencies
FROM cgr.dev/chainguard/node:latest-dev AS deps

USER root
RUN corepack enable && corepack prepare pnpm@latest --activate
USER node

WORKDIR /app

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM cgr.dev/chainguard/node:latest-dev AS build

USER root
RUN corepack enable && corepack prepare pnpm@latest --activate
USER node

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json nest-cli.json ./
COPY --chown=node:node src ./src

RUN pnpm build

# Stage 3: Production dependencies only
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

USER root
RUN corepack enable && corepack prepare pnpm@latest --activate
USER node

WORKDIR /app

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 4: Runtime
FROM cgr.dev/chainguard/node:latest AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/src/mail/*.html ./dist/mail
COPY --chown=node:node package.json ./
COPY --chown=node:node drizzle ./drizzle

EXPOSE 3000
EXPOSE 3001

CMD ["dist/main"]
