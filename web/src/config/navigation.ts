import {
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarHeart,
  ClipboardCheck,
  FileText,
  FolderTree,
  GitBranch,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  Network,
  Newspaper,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  USERS_CHANGE_OWN_PASSWORD: "users.change-own-password",
  AUDIT_LOGS_VIEW: "audit-logs.view",
  CLAN_MANAGE: "clan.manage",
  BRANCHES_MANAGE: "branches.manage",
  PERSONS_MANAGE: "persons.manage",
  RELATIONSHIPS_MANAGE: "relationships.manage",
  DEATH_ANNIVERSARIES_MANAGE: "death-anniversaries.manage",
  EVENTS_MANAGE: "events.manage",
  EVENTS_PUBLISH: "events.publish",
  NOTIFICATIONS_MANAGE_OWN: "notifications.manage-own",
  REMINDER_SETTINGS_MANAGE_OWN: "reminder-settings.manage-own",
  POSTS_MANAGE: "posts.manage",
  POSTS_PUBLISH: "posts.publish",
  CATEGORIES_MANAGE: "categories.manage",
  ALBUMS_MANAGE: "albums.manage",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_MANAGE: "media.manage",
  PAGES_MANAGE: "pages.manage",
  ROLES_MANAGE_BRANCH_SCOPE: "roles.manage-branch-scope",
  CHANGE_REQUESTS_CREATE: "change-requests.create",
  CHANGE_REQUESTS_REVIEW: "change-requests.review",
  DECEASED_INFO_UPDATE_BRANCH: "deceased-info.update-branch",
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
    title: "Gia phả",
    items: [
      {
        title: "Quản lý gia phả",
        href: "/genealogy",
        icon: GitBranch,
        permissions: [PERMISSIONS.CLAN_MANAGE],
      },
      {
        title: "Chi/nhánh",
        href: "/genealogy/branches",
        icon: GitBranch,
        permissions: [PERMISSIONS.BRANCHES_MANAGE],
      },
      {
        title: "Thành viên",
        href: "/genealogy/persons",
        icon: Users,
        permissions: [PERMISSIONS.PERSONS_MANAGE],
      },
      {
        title: "Quan hệ",
        href: "/genealogy/relationships",
        icon: Network,
        permissions: [PERMISSIONS.RELATIONSHIPS_MANAGE],
      },
      {
        title: "Cây phả hệ",
        href: "/family-tree",
        icon: Network,
        permissions: [],
      },
      {
        title: "Tra cứu",
        href: "/people",
        icon: Search,
        permissions: [],
      },
    ],
  },
  {
    title: "Lịch & Giỗ chạp",
    items: [
      {
        title: "Lịch sự kiện",
        href: "/calendar",
        icon: CalendarDays,
        permissions: [],
      },
      {
        title: "Sự kiện",
        href: "/calendar/events",
        icon: CalendarClock,
        permissions: [],
      },
      {
        title: "Ngày giỗ",
        href: "/calendar/death-anniversaries",
        icon: CalendarHeart,
        permissions: [PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE],
      },
      {
        title: "Thông báo",
        href: "/notifications",
        icon: Bell,
        permissions: [PERMISSIONS.NOTIFICATIONS_MANAGE_OWN],
      },
      {
        title: "Cài đặt nhắc lịch",
        href: "/account/notification-settings",
        icon: Settings,
        permissions: [PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN],
      },
    ],
  },
  {
    title: "Nội dung",
    items: [
      {
        title: "Bài viết",
        href: "/content/posts",
        icon: Newspaper,
        permissions: [PERMISSIONS.POSTS_MANAGE],
      },
      {
        title: "Chuyên mục",
        href: "/content/categories",
        icon: FolderTree,
        permissions: [PERMISSIONS.CATEGORIES_MANAGE],
      },
      {
        title: "Album",
        href: "/content/albums",
        icon: ImageIcon,
        permissions: [PERMISSIONS.ALBUMS_MANAGE],
      },
      {
        title: "Thư viện media",
        href: "/content/media",
        icon: Library,
        permissions: [PERMISSIONS.MEDIA_MANAGE],
      },
      {
        title: "Trang giới thiệu",
        href: "/content/pages",
        icon: FileText,
        permissions: [PERMISSIONS.PAGES_MANAGE],
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
        title: "Đề xuất chỉnh sửa",
        href: "/change-requests",
        icon: ClipboardCheck,
        permissions: [PERMISSIONS.CHANGE_REQUESTS_CREATE],
      },
      {
        title: "Phân quyền theo chi",
        href: "/branch-scopes",
        icon: ShieldCheck,
        permissions: [PERMISSIONS.ROLES_MANAGE_BRANCH_SCOPE],
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
  const items = navigationGroups.flatMap((group) => group.items);
  const exact = items.find((navigationItem) => navigationItem.href === pathname);
  if (exact) {
    return exact.title;
  }

  // Best-effort match for nested routes (e.g. /content/posts/new).
  const prefixMatch = items
    .filter((navigationItem) => pathname.startsWith(`${navigationItem.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return prefixMatch?.title ?? "Không tìm thấy";
}
