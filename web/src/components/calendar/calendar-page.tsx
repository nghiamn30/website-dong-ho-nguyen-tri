"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/auth";
import {
  CalendarMonthResponse,
  eventTypeLabels,
  getCalendarMonth,
} from "@/lib/calendar";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<CalendarMonthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextYear: number, nextMonth: number) => {
    try {
      const response = await getCalendarMonth(nextYear, nextMonth);
      setData(response);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được lịch.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCalendarMonth(year, month)
      .then((response) => {
        if (!active) return;
        setData(response);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được lịch.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  const goPrev = () => {
    setIsLoading(true);
    if (month === 1) {
      setYear((value) => value - 1);
      setMonth(12);
    } else {
      setMonth((value) => value - 1);
    }
  };

  const goNext = () => {
    setIsLoading(true);
    if (month === 12) {
      setYear((value) => value + 1);
      setMonth(1);
    } else {
      setMonth((value) => value + 1);
    }
  };

  const goToday = () => {
    setIsLoading(true);
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const leadingBlanks = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    // Convert Sunday=0..Saturday=6 to Monday-first index.
    return (firstWeekday + 6) % 7;
  }, [year, month]);

  const todayIso = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Lịch sự kiện dòng họ"
          description="Lịch giỗ, giỗ tổ, họp họ và các sự kiện đã công bố theo tháng."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Tháng trước">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-32 text-center text-sm font-medium">
            {MONTH_NAMES[month - 1]} / {year}
          </div>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Tháng sau">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Hôm nay
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void load(year, month)} aria-label="Tải lại">
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
            <CalendarDays className="size-4" /> {MONTH_NAMES[month - 1]} năm {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {label}
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div key={`blank-${index}`} className="min-h-24 rounded-md" />
              ))}
              {(data?.days ?? []).map((day) => {
                const isToday = day.date === todayIso;
                const dayNumber = Number(day.date.slice(-2));
                return (
                  <div
                    key={day.date}
                    className={`min-h-24 rounded-md border p-1 ${
                      isToday ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="mb-1 text-right text-xs font-medium text-muted-foreground">
                      {dayNumber}
                    </div>
                    <div className="space-y-1">
                      {day.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/calendar/events/${event.id}`}
                          className="block"
                        >
                          <Badge
                            variant="secondary"
                            className="w-full justify-start truncate text-[11px] font-normal"
                            title={`${eventTypeLabels[event.eventType]}: ${event.title}`}
                          >
                            {event.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
