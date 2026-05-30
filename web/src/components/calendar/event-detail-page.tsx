"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/auth";
import {
  EventRecord,
  eventStatusLabels,
  eventTypeLabels,
  getEvent,
} from "@/lib/calendar";
import { formatDateTime } from "@/lib/date-time";

export function EventDetailPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getEvent(eventId)
      .then((record) => {
        if (!active) return;
        setEvent(record);
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
  }, [eventId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/calendar/events"
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader title="Chi tiết sự kiện" />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : event ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{event.title}</CardTitle>
              <Badge variant="secondary">{eventTypeLabels[event.eventType]}</Badge>
              <Badge variant="outline">{eventStatusLabels[event.status]}</Badge>
              {event.sourceType === "AUTO_ANNIVERSARY" ? (
                <Badge variant="outline">Tự động từ ngày giỗ</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Bắt đầu: </span>
              {formatDateTime(event.startDatetime)}
            </div>
            {event.endDatetime ? (
              <div>
                <span className="text-muted-foreground">Kết thúc: </span>
                {formatDateTime(event.endDatetime)}
              </div>
            ) : null}
            {event.calendarType === "LUNAR" && event.lunarDay && event.lunarMonth ? (
              <div>
                <span className="text-muted-foreground">Âm lịch: </span>
                {event.lunarDay}/{event.lunarMonth}
                {event.isLeapMonth ? " (nhuận)" : ""}
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Phạm vi: </span>
              {event.visibilityScope === "CLAN" ? "Toàn họ" : "Theo chi/nhánh"}
            </div>
            {event.location ? (
              <div className="flex items-center gap-1">
                <MapPin className="size-4 text-muted-foreground" />
                {event.location}
              </div>
            ) : null}
            {event.description ? (
              <p className="whitespace-pre-wrap text-foreground">{event.description}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
