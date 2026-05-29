FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile

COPY web ./web/

WORKDIR /app/web

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=appuser:appgroup /app/web/public ./web/public

USER appuser

WORKDIR /app/web

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login || exit 1

CMD ["node", "server.js"]
