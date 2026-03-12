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
COPY --chown=node:node package.json pnpm-lock.yaml tsconfig.json tsconfig.app.json tsconfig.node.json index.html vite.config.ts components.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node .env.example ./.env

RUN pnpm build

# Stage 3: Runtime
FROM cgr.dev/chainguard/nginx:latest-dev AS runtime

# Remove default nginx config that conflicts with our SPA config
USER root
RUN rm -f /etc/nginx/conf.d/nginx.default.conf
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

# Remove default nginx files and copy build output
# Files must be owned by nginx user so vite-envs.sh can rewrite index.html at startup
RUN rm -f /var/lib/nginx/html/index.html /var/lib/nginx/html/50x.html
COPY --from=build --chown=nginx:nginx /app/dist/ /var/lib/nginx/html/

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "/var/lib/nginx/html/vite-envs.sh && nginx -g 'daemon off;'"]
