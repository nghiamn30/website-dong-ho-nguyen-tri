"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CircleAlert,
  CircleCheck,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserRound,
  WifiOff,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppLogo } from "@/components/brand/app-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ApiError, getCurrentUser, login } from "@/lib/auth";
import { formatInVietnamTimeZone } from "@/lib/date-time";

const APP_VERSION = "v0.1.0";
const SYSTEM_HEALTH_POLL_MS = 15_000;

type SystemStatus = "online" | "maintenance" | "checking";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user) => {
        if (!active) {
          return;
        }

        const nextPath = searchParams.get("next");
        router.replace(
          nextPath && nextPath !== "/login" ? nextPath : user.defaultPath,
        );
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(employeeCode, password);
      const nextPath = searchParams.get("next");
      router.replace(
        nextPath && nextPath !== "/login" ? nextPath : result.user.defaultPath,
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Không thể đăng nhập ở thời điểm hiện tại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_500px]">
      <section className="relative hidden overflow-hidden border-r bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_45%),linear-gradient(135deg,var(--color-sidebar)_0%,var(--color-background)_100%)] lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-foreground)_8%,transparent)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
        <div className="relative z-10 flex h-full flex-col px-10 py-9 xl:px-12 xl:py-10">
          <div className="flex items-center gap-3">
            <AppLogo size={48} />
            <div>
              <p className="text-sm font-semibold">Dòng họ Nguyễn Trí</p>
              <p className="text-xs text-muted-foreground">
                Nền tảng quản trị
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <div className="max-w-[560px]">
              <h1 className="text-4xl leading-tight font-semibold tracking-normal xl:text-[3.25rem]">
                Khung kỹ thuật
                <br />
                website-dong-ho-nguyen-tri
              </h1>
            </div>
          </div>

          <div className="font-vietnamese mt-auto text-xs leading-5 text-muted-foreground">
            <p className="font-medium text-foreground">
              Sẵn sàng cho các giai đoạn triển khai nghiệp vụ theo tài liệu.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-muted/25 px-4 py-8 sm:px-6 lg:bg-background">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 lg:px-8">
          <div className="pointer-events-auto">
            <SystemStatusBadge />
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <SystemClockBadge />
            <ThemeToggle />
          </div>
        </header>

        <div className="w-full max-w-[404px] space-y-5">
          <div className="space-y-4 text-center lg:hidden">
            <AppLogo className="mx-auto" size={56} />
            <div>
              <p className="text-base font-semibold">Dòng họ Nguyễn Trí</p>
              <p className="text-sm text-muted-foreground">
                Nền tảng quản trị
              </p>
            </div>
          </div>

          <Card className="rounded-xl border-border/80 bg-card shadow-[0_24px_70px_-46px_rgba(15,23,42,0.7)]">
            <CardHeader className="space-y-3 px-5 pt-5">
              <div className="hidden items-center gap-3 lg:flex">
                <AppLogo size={44} />
                <div>
                  <CardTitle>Đăng nhập hệ thống</CardTitle>
                  <CardDescription>Dòng họ Nguyễn Trí</CardDescription>
                </div>
              </div>
              <div className="lg:hidden">
                <CardTitle>Đăng nhập hệ thống</CardTitle>
                <CardDescription>
                  Nhập mã tài khoản và mật khẩu để tiếp tục.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form className="space-y-5" onSubmit={onSubmit}>
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Đăng nhập thất bại</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Mã tài khoản</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="employeeCode"
                      autoComplete="username"
                      className="h-10 bg-background pl-9"
                      value={employeeCode}
                      onChange={(event) =>
                        setEmployeeCode(event.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã tài khoản"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      autoComplete="current-password"
                      className="h-10 bg-background pl-9"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      required
                    />
                  </div>
                </div>

                <Button
                  className="h-10 w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogIn data-icon="inline-start" />
                  )}
                  Đăng nhập
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/70 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-white/70">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary dark:text-primary" />
            <p>
              Chỉ tài khoản được cấp quyền mới truy cập được hệ thống. Mọi thao
              tác quan trọng sẽ được ghi nhật ký.
            </p>
          </div>
        </div>

        <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span className="pointer-events-auto">website-dong-ho-nguyen-tri</span>
          <span className="pointer-events-auto">Phiên bản {APP_VERSION}</span>
        </footer>
      </section>
    </div>
  );
}

function SystemStatusBadge() {
  const [status, setStatus] = useState<SystemStatus>("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        await getCurrentUser();
        if (active) {
          setStatus("online");
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus(error instanceof ApiError ? "online" : "maintenance");
      }
    }

    void check();
    const timer = window.setInterval(check, SYSTEM_HEALTH_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (status === "checking") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground"
      >
        <Loader2 className="size-3.5 animate-spin" />
        Đang kiểm tra hệ thống
      </Badge>
    );
  }

  if (status === "online") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-emerald-300/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      >
        <CircleCheck className="size-3.5" />
        Hệ thống hoạt động
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-amber-300/70 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300"
    >
      {typeof navigator !== "undefined" && !navigator.onLine ? (
        <WifiOff className="size-3.5" />
      ) : (
        <CircleAlert className="size-3.5" />
      )}
      Hệ thống đang bảo trì
    </Badge>
  );
}

let cachedClockNow: Date | null = null;
const getClientClockSnapshot = () => cachedClockNow;
const getServerClockSnapshot = () => null;
const subscribeClock = (notify: () => void) => {
  cachedClockNow = new Date();
  queueMicrotask(notify);
  const timer = window.setInterval(() => {
    cachedClockNow = new Date();
    notify();
  }, 1000);
  return () => window.clearInterval(timer);
};

function SystemClockBadge() {
  const now = useSyncExternalStore(
    subscribeClock,
    getClientClockSnapshot,
    getServerClockSnapshot,
  );

  if (!now) {
    return (
      <Badge
        variant="outline"
        className="border-border/80 bg-background/80 px-2.5 py-1 font-mono text-xs tabular-nums text-muted-foreground"
      >
        --:--:-- --/--/----
      </Badge>
    );
  }

  const time = formatInVietnamTimeZone(now, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const date = formatInVietnamTimeZone(now, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Badge
      variant="outline"
      className="border-border/80 bg-background/80 px-2.5 py-1 font-mono text-xs tabular-nums text-foreground"
    >
      {time} {date}
    </Badge>
  );
}
