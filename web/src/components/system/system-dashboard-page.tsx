"use client";

import { History, ShieldCheck, Users } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/config/navigation";

const foundationItems = [
  {
    title: "Xác thực",
    description: "JWT HttpOnly cookie, đăng nhập và đăng xuất.",
    icon: ShieldCheck,
  },
  {
    title: "Người dùng",
    description: "Tài khoản, vai trò và quyền truy cập nền tảng.",
    icon: Users,
  },
  {
    title: "Nhật ký",
    description: "Ghi nhận đăng nhập và thao tác quản trị quan trọng.",
    icon: History,
  },
];

export function SystemDashboardPage() {
  return (
    <ProtectedPage permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Tổng quan nền tảng"
            description="Khung kỹ thuật chung cho website-dong-ho-nguyen-tri."
          />
          <Badge variant="secondary" className="w-fit">
            Sẵn sàng phát triển nghiệp vụ
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {foundationItems.map((item) => (
            <Card key={item.title}>
              <CardHeader className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái khởi tạo</CardTitle>
            <CardDescription>
              Dự án hiện chỉ giữ các thành phần nền tảng dùng chung.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>Frontend, backend, Prisma và Docker đã được cấu hình.</p>
            <p>Thư mục `./docs` được giữ riêng cho các giai đoạn tiếp theo.</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
