"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6">
      <Alert className="max-w-xl border-destructive/30 bg-destructive/5">
        <LockKeyhole className="size-4" />
        <AlertTitle>Không có quyền truy cập</AlertTitle>
        <AlertDescription className="mt-3 space-y-4">
          <p>Tài khoản hiện tại không có quyền mở khu vực này.</p>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Về tổng quan
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}
