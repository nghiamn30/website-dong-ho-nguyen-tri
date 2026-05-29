"use client";

import { hasAllPermissions } from "@/config/navigation";
import { AccessDenied } from "./access-denied";
import { PageSkeleton } from "@/components/pages/page-skeleton";
import { useAuth } from "./auth-provider";

export function ProtectedPage({
  permissions,
  children,
}: {
  permissions: readonly string[];
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <PageSkeleton />;
  }

  if (!user || !hasAllPermissions(user.permissions, permissions)) {
    return <AccessDenied />;
  }

  return children;
}
