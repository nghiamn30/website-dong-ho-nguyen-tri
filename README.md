# website-dong-ho-nguyen-tri

Khung nền tảng kỹ thuật được khởi tạo từ `mdg-website-vicenza`, đã rút về phạm vi dùng chung để tiếp tục xây dựng nghiệp vụ theo `./docs`.

## Tech Stack

- `web`: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/base-ui style components, lucide-react, next-themes, Vitest.
- `backend`: NestJS 11, TypeScript, JWT auth, RBAC guard, Prisma ORM 7/PostgreSQL, bcryptjs, Jest.
- Workspace: pnpm 10, Docker Compose, ESLint, Prisma migrations.

## Phạm Vi Hiện Có

- Authentication bằng JWT HttpOnly cookie.
- Authorization theo permission guard ở backend và protected route ở frontend.
- Layout, sidebar, theme toggle, common UI components.
- Trang hệ thống: login, dashboard nền tảng, quản lý người dùng, audit logs, 403, 404.
- API nền tảng: health, auth, users, audit logs.
- Prisma schema nền tảng: users, roles, permissions, audit logs.

Chưa có menu, module, schema, API hoặc mock data nghiệp vụ gia phả.

## Chạy Local

```bash
pnpm install
pnpm backend:dev
pnpm web:dev
```

URL local:

- Web: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- Public health: `http://localhost:3001/api`

Tài khoản dev in-memory mặc định:

- Mã đăng nhập: `ADMIN001`
- Mật khẩu: `admin123`

Production không dùng mật khẩu mẫu. Tạo admin đầu tiên bằng `BOOTSTRAP_ADMIN_PASSWORD` hoặc quy trình vận hành nội bộ, sau đó đổi mật khẩu ngay.

## Database

Mặc định `DB_ENABLED=false`, backend chạy bằng in-memory repository để smoke test nhanh. Khi cần PostgreSQL local:

```powershell
Copy-Item backend\.env.example backend\.env
# Cập nhật DB_ENABLED=true và DATABASE_URL/DB_NAME nếu cần
pnpm db:init
pnpm backend:dev
```

Database mặc định: `dong_ho_nguyen_tri`.

## Kiểm Tra

```bash
pnpm web:test
pnpm backend:test
pnpm build
```
