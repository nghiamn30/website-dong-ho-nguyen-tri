"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/pages/page-header";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  createEvent,
  deleteEvent,
  EventPayload,
  EventRecord,
  EventStatus,
  EventType,
  EventVisibility,
  eventStatusLabels,
  eventTypeLabels,
  generateEvents,
  getEvents,
  updateEvent,
} from "@/lib/calendar";
import { BranchRecord, getBranches } from "@/lib/genealogy";
import { formatDateTime } from "@/lib/date-time";

const EVENT_TYPE_OPTIONS: EventType[] = [
  "CLAN_MEETING",
  "GOOD_NEWS",
  "SAD_NEWS",
  "OTHER",
];

interface EventFormState {
  title: string;
  eventType: EventType;
  startDatetime: string;
  endDatetime: string;
  location: string;
  description: string;
  visibilityScope: EventVisibility;
  branchId: string;
  publish: boolean;
}

const emptyForm: EventFormState = {
  title: "",
  eventType: "CLAN_MEETING",
  startDatetime: "",
  endDatetime: "",
  location: "",
  description: "",
  visibilityScope: "CLAN",
  branchId: "",
  publish: true,
};

const statusVariants: Record<EventStatus, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  COMPLETED: "outline",
  CANCELLED: "outline",
};

export function EventsPage() {
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions.includes(PERMISSIONS.EVENTS_MANAGE));
  const canPublish = Boolean(user?.permissions.includes(PERMISSIONS.EVENTS_PUBLISH));

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [generateYear, setGenerateYear] = useState(String(new Date().getFullYear()));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [eventList, branchList] = await Promise.all([
        canManage ? getEvents() : getEvents({ status: "PUBLISHED" }),
        getBranches().catch(() => []),
      ]);
      setEvents(eventList);
      setBranches(branchList);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được sự kiện.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    let active = true;
    Promise.all([
      canManage ? getEvents() : getEvents({ status: "PUBLISHED" }),
      getBranches().catch(() => [] as BranchRecord[]),
    ])
      .then(([eventList, branchList]) => {
        if (!active) return;
        setEvents(eventList);
        setBranches(branchList);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được sự kiện.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canManage]);

  const branchName = useMemo(() => {
    const map = new Map(branches.map((branch) => [branch.id, branch.name]));
    return (id?: string) => (id ? (map.get(id) ?? "—") : "Toàn họ");
  }, [branches]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startDatetime) {
      toast.error("Cần nhập tiêu đề và thời gian bắt đầu.");
      return;
    }
    setIsSaving(true);
    try {
      const payload: EventPayload = {
        title: form.title.trim(),
        eventType: form.eventType,
        startDatetime: toIso(form.startDatetime),
        endDatetime: form.endDatetime ? toIso(form.endDatetime) : undefined,
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
        visibilityScope: form.visibilityScope,
        branchId:
          form.visibilityScope === "BRANCH" ? form.branchId || undefined : undefined,
        status: form.publish && canPublish ? "PUBLISHED" : "DRAFT",
      };
      const created = await createEvent(payload);
      toast.success(
        created.status === "PUBLISHED"
          ? "Đã tạo và công bố sự kiện."
          : "Đã lưu sự kiện ở trạng thái nháp.",
      );
      setForm(emptyForm);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tạo được sự kiện.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (target: EventRecord, status: EventStatus) => {
    try {
      await updateEvent(target.id, { status });
      toast.success("Đã cập nhật trạng thái sự kiện.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  const handleDelete = async (target: EventRecord) => {
    try {
      await deleteEvent(target.id);
      toast.success("Đã xóa sự kiện.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  const handleGenerate = async () => {
    const year = Number(generateYear);
    if (!Number.isInteger(year)) {
      toast.error("Năm không hợp lệ.");
      return;
    }
    try {
      const result = await generateEvents(year);
      toast.success(
        `Đã tạo ${result.created} sự kiện giỗ năm ${year} (bỏ qua ${result.skipped} đã có).`,
      );
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tạo được lịch giỗ.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Sự kiện dòng họ"
          description="Quản lý sự kiện thủ công, sinh sự kiện giỗ tự động và theo dõi sự kiện sắp tới."
        />
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarPlus className="size-4" /> Tạo sự kiện thủ công
              </CardTitle>
              <CardDescription>
                Họp họ, tin vui, tin buồn hoặc sự kiện khác.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="event-title">Tiêu đề</Label>
                  <Input
                    id="event-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Ví dụ: Họp họ đầu xuân"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Loại sự kiện</Label>
                  <Select
                    value={form.eventType}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, eventType: value as EventType }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {eventTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Phạm vi</Label>
                  <Select
                    value={form.visibilityScope}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        visibilityScope: value as EventVisibility,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLAN">Toàn họ</SelectItem>
                      <SelectItem value="BRANCH">Theo chi/nhánh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.visibilityScope === "BRANCH" ? (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Chi/nhánh</Label>
                    <Select
                      value={form.branchId}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, branchId: value ?? "" }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn chi/nhánh" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label htmlFor="event-start">Bắt đầu</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={form.startDatetime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, startDatetime: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-end">Kết thúc (tùy chọn)</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={form.endDatetime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, endDatetime: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="event-location">Địa điểm</Label>
                  <Input
                    id="event-location"
                    value={form.location}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="Nhà thờ họ..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="event-description">Mô tả</Label>
                  <Textarea
                    id="event-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Button type="submit" disabled={isSaving}>
                    {form.publish && canPublish ? "Tạo & công bố" : "Lưu nháp"}
                  </Button>
                  {!canPublish ? (
                    <span className="text-xs text-muted-foreground">
                      Bạn chỉ tạo được bản nháp; trưởng họ/admin sẽ công bố.
                    </span>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          {canPublish ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4" /> Sinh lịch giỗ tự động
                </CardTitle>
                <CardDescription>
                  Tạo sự kiện giỗ từ các ngày giỗ âm lịch cho một năm dương.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="generate-year">Năm dương lịch</Label>
                  <Input
                    id="generate-year"
                    type="number"
                    value={generateYear}
                    onChange={(event) => setGenerateYear(event.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={handleGenerate}>
                  Sinh sự kiện giỗ
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách sự kiện</CardTitle>
          <CardDescription>
            {canManage ? "Bao gồm cả bản nháp." : "Các sự kiện đã công bố."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có sự kiện nào.</p>
          ) : (
            <ul className="divide-y">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/calendar/events/${event.id}`}
                        className="font-medium hover:underline"
                      >
                        {event.title}
                      </Link>
                      <Badge variant="secondary" className="text-[11px]">
                        {eventTypeLabels[event.eventType]}
                      </Badge>
                      <Badge variant={statusVariants[event.status]} className="text-[11px]">
                        {eventStatusLabels[event.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.startDatetime)} · {branchName(event.branchId)}
                      {event.sourceType === "AUTO_ANNIVERSARY" ? " · Tự động" : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      {canPublish && event.status === "DRAFT" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(event, "PUBLISHED")}
                        >
                          Công bố
                        </Button>
                      ) : null}
                      {event.status !== "CANCELLED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(event, "CANCELLED")}
                        >
                          Hủy
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(event)}
                        aria-label="Xóa"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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

function toIso(localValue: string): string {
  // datetime-local gives "YYYY-MM-DDTHH:mm"; treat it as Vietnam local time.
  const withSeconds = localValue.length === 16 ? `${localValue}:00` : localValue;
  return `${withSeconds}+07:00`;
}
