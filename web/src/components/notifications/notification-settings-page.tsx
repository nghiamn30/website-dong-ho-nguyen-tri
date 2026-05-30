"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications";

export function NotificationSettingsPage() {
  return (
    <ProtectedPage permissions={[PERMISSIONS.REMINDER_SETTINGS_MANAGE_OWN]}>
      <SettingsContent />
    </ProtectedPage>
  );
}

function SettingsContent() {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getNotificationSettings()
      .then((settings) => {
        if (!active) return;
        setInAppEnabled(settings.inAppEnabled);
        setEmailEnabled(settings.emailEnabled);
        setEmail(settings.email ?? "");
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được cài đặt.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateNotificationSettings({
        inAppEnabled,
        emailEnabled,
        email: email.trim(),
      });
      toast.success("Đã lưu cài đặt nhận nhắc.");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được cài đặt.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt nhận nhắc"
        description="Chọn kênh nhận nhắc lịch giỗ và sự kiện dòng họ."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Kênh nhận nhắc</CardTitle>
          <CardDescription>
            Email chỉ được gửi khi quản trị bật cấu hình email cho hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="in-app">Thông báo trong hệ thống</Label>
                  <p className="text-xs text-muted-foreground">
                    Hiển thị nhắc lịch trong hộp thông báo.
                  </p>
                </div>
                <Switch
                  id="in-app"
                  checked={inAppEnabled}
                  onCheckedChange={setInAppEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-enabled">Nhận nhắc qua email</Label>
                  <p className="text-xs text-muted-foreground">
                    Gửi email khi cấu hình email sẵn sàng.
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              {emailEnabled ? (
                <div className="space-y-1">
                  <Label htmlFor="email">Địa chỉ email nhận nhắc</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ten@example.com"
                  />
                </div>
              ) : null}
              <Button type="submit" disabled={isSaving}>
                <Save className="size-4" /> Lưu cài đặt
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
