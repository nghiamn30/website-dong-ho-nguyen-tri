# Backend

NestJS API nền tảng cho `website-dong-ho-nguyen-tri`.

## Thành phần

- Auth JWT qua HttpOnly cookie.
- RBAC permission guard.
- Users, roles, permissions.
- Audit logs.
- Health endpoints.
- Prisma ORM/PostgreSQL, chạy được in-memory khi `DB_ENABLED=false`.

## Chạy local

```bash
pnpm install
pnpm --dir backend start:dev
```

Public health: `http://localhost:3001/api`

## Prisma

```bash
pnpm --dir backend prisma:generate
pnpm --dir backend prisma:migrate
```
