FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY web/package.json ./web/

RUN pnpm install --frozen-lockfile

COPY backend/prisma ./backend/prisma/
COPY backend/prisma.config.ts backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json ./backend/
COPY backend/src ./backend/src/

WORKDIR /app/backend

RUN pnpm prisma:generate
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/web/package.json ./web/
COPY --from=builder --chown=appuser:appgroup /app/backend/prisma ./backend/prisma/
COPY --from=builder --chown=appuser:appgroup /app/backend/src/generated ./backend/src/generated/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder --chown=appuser:appgroup /app/backend/dist ./backend/dist/

USER appuser

WORKDIR /app/backend

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=180s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api || exit 1

CMD ["node", "dist/main.js"]
