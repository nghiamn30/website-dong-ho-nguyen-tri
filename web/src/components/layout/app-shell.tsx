"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { AppLogo } from "@/components/brand/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageSkeleton } from "@/components/pages/page-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getRouteTitle, getVisibleNavigation } from "@/config/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AuthProvider>
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { user, status, signOut } = useAuth();
  const pathname = usePathname();

  if (status === "loading" || !user) {
    return <PageSkeleton />;
  }

  const visibleNavigation = getVisibleNavigation(user.permissions);
  const initials = user.name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <AppLogo size={32} />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">
                Dòng họ Nguyễn Trí
              </p>
              <p className="truncate text-xs text-sidebar-foreground/65">
                Nền tảng quản trị
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {visibleNavigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.href}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/65">
                {user.employeeCode}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 min-w-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <AppBreadcrumb pathname={pathname} />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut data-icon="inline-start" />
              Đăng xuất
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t bg-muted/20 px-4 py-4 text-[13px] text-muted-foreground md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="font-vietnamese flex min-w-0 items-center gap-3">
              <AppLogo size={36} className="hidden sm:flex" />
              <div className="min-w-0">
                <p className="break-words font-semibold leading-5 text-foreground">
                  Dòng họ Nguyễn Trí
                </p>
                <p className="mt-0.5 leading-5">
                  Khung nền tảng kỹ thuật sẵn sàng cho các giai đoạn nghiệp vụ.
                </p>
              </div>
            </div>
            <div className="font-vietnamese leading-5 lg:text-right">
              <p className="font-medium text-foreground/80">
                website-dong-ho-nguyen-tri
              </p>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppBreadcrumb({ pathname }: { pathname: string }) {
  const title = getRouteTitle(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard" />}>
            Hệ thống
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
