"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Home, LifeBuoy } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="pointer-events-auto flex items-center gap-2.5">
          <AppLogo size={36} />
          <div className="leading-tight">
            <p className="text-xs font-semibold">Dòng họ Nguyễn Trí</p>
            <p className="text-[11px] text-muted-foreground">
              Nền tảng quản trị
            </p>
          </div>
        </div>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 w-full max-w-xl space-y-7 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <Compass className="size-3.5 text-primary" />
          Lỗi 404 - Trang không tồn tại
        </span>

        <div>
          <p className="text-[clamp(7rem,18vw,11rem)] leading-none font-bold tracking-normal text-primary select-none">
            404
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Không tìm thấy trang
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            URL có thể đã thay đổi, bị di chuyển hoặc tài nguyên không thuộc hệ
            thống hiện tại.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className={cn(buttonVariants(), "w-full gap-2 sm:w-auto")}
          >
            <Home className="size-4" />
            Về tổng quan
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full gap-2 sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Quay lại trang trước
          </Button>
        </div>

        <div className="mx-auto flex max-w-md items-start gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-left text-xs leading-5 text-muted-foreground shadow-sm backdrop-blur">
          <LifeBuoy className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Nếu vấn đề tiếp diễn, hãy kiểm tra lại đường dẫn hoặc liên hệ quản
            trị viên hệ thống.
          </p>
        </div>
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-4 pb-4 text-[11px] text-muted-foreground/80 sm:px-6 lg:px-8">
        <span className="pointer-events-auto">website-dong-ho-nguyen-tri</span>
      </footer>
    </main>
  );
}
