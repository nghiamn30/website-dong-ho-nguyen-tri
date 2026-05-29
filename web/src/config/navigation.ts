import {
  History,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  USERS_CHANGE_OWN_PASSWORD: "users.change-own-password",
  AUDIT_LOGS_VIEW: "audit-logs.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permissions: Permission[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    title: "Nền tảng",
    items: [
      {
        title: "Tổng quan",
        href: "/dashboard",
        icon: LayoutDashboard,
        permissions: [PERMISSIONS.DASHBOARD_VIEW],
      },
    ],
  },
  {
    title: "Quản trị",
    items: [
      {
        title: "Người dùng",
        href: "/users",
        icon: Users,
        permissions: [PERMISSIONS.USERS_VIEW],
      },
      {
        title: "Nhật ký thao tác",
        href: "/audit-logs",
        icon: History,
        permissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
      },
    ],
  },
];

export const routePermissions: Record<string, Permission[]> = Object.fromEntries(
  navigationGroups.flatMap((group) =>
    group.items.map((item) => [item.href, item.permissions]),
  ),
) as Record<string, Permission[]>;

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: readonly string[],
) {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
}

export function getVisibleNavigation(userPermissions: string[]) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasAllPermissions(userPermissions, item.permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getRouteTitle(pathname: string) {
  const item = navigationGroups
    .flatMap((group) => group.items)
    .find((navigationItem) => navigationItem.href === pathname);

  return item?.title ?? "Không tìm thấy";
}
