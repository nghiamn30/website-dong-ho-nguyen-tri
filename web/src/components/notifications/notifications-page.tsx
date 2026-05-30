"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCheck, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-time";
import {
  markAllNotificationsRead,
  markNotificationRead,
  NotificationRecord,
  getNotifications,
  runReminders,
} from "@/lib/notifications";

export function NotificationsPage() {
  return (
    <ProtectedPage permissions={[PERMISSIONS.NOTIFICATIONS_MANAGE_OWN]}>
      <NotificationsContent />
    </ProtectedPage>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const canRunReminders = Boolean(
    user?.permissions.includes(PERMISSIONS.AUDIT_LOGS_VIEW),
  );
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await getNotifications(false, 100);
      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được thông báo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getNotifications(false, 100)
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setUnreadCount(response.unreadCount);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được thông báo.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleMarkRead = async (record: NotificationRecord) => {
    if (record.readAt) return;
    try {
      await markNotificationRead(record.id);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  const handleMarkAll = async () => {
    try {
      const result = await markAllNotificationsRead();
      toast.success(`Đã đánh dấu ${result.updated} thông báo là đã đọc.`);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  const handleRunReminders = async () => {
    try {
      const result = await runReminders();
      toast.success(
        `Đã quét ${result.scannedEvents} sự kiện, tạo ${result.created} nhắc lịch (bỏ qua ${result.skipped}).`,
      );
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không chạy được job nhắc.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Thông báo của tôi"
          description="Nhắc lịch giỗ và sự kiện dòng họ gửi tới bạn."
        />
        <div className="flex items-center gap-2">
          {canRunReminders ? (
            <Button variant="outline" onClick={handleRunReminders}>
              <Play className="size-4" /> Chạy job nhắc
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleMarkAll} disabled={unreadCount === 0}>
            <CheckCheck className="size-4" /> Đọc tất cả
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-4" /> Hộp thông báo
            {unreadCount > 0 ? (
              <Badge variant="default">{unreadCount} chưa đọc</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào.</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-start justify-between gap-3 py-3 ${
                    item.readAt ? "opacity-70" : ""
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.readAt ? (
                        <span className="size-2 rounded-full bg-primary" aria-hidden />
                      ) : null}
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {item.channel === "EMAIL" ? "Email" : "Trong hệ thống"}
                      </Badge>
                      {item.status === "FAILED" ? (
                        <Badge variant="destructive" className="text-[11px]">
                          Lỗi gửi
                        </Badge>
                      ) : null}
                    </div>
                    {item.content ? (
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                      {item.eventId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/calendar/events/${item.eventId}`}
                            className="hover:underline"
                          >
                            Xem sự kiện
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {!item.readAt ? (
                    <Button size="sm" variant="outline" onClick={() => handleMarkRead(item)}>
                      Đã đọc
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
