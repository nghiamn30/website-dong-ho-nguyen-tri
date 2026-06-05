"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Images, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/portal/album-card";
import { PostCard } from "@/components/portal/post-card";
import { ApiError } from "@/lib/auth";
import { eventTypeLabels } from "@/lib/calendar";
import { getPortalHome, type PortalHome as PortalHomeData } from "@/lib/content";
import { formatDate } from "@/lib/date-time";

export function PortalHome() {
  const [data, setData] = useState<PortalHomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPortalHome()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Không tải được trang chủ.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryName = useMemo(() => {
    const map = new Map((data?.categories ?? []).map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [data?.categories]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  const clanName = data?.clan?.name ?? "Dòng họ Nguyễn Trí";
  const featured = data?.pinnedPosts ?? [];
  const latest = data?.latestPosts ?? [];
  const allPosts = [...featured, ...latest];
  const albums = data?.albums ?? [];
  const events = data?.upcomingEvents ?? [];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Cổng thông tin
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          {clanName}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {data?.clan?.description ??
            "Nơi lưu giữ truyền thống, thông báo, hoạt động và tư liệu của dòng họ qua các thế hệ."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button render={<Link href="/tin-tuc" />}>
            Xem tin tức <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="outline" render={<Link href="/gioi-thieu" />}>
            Giới thiệu dòng họ
          </Button>
        </div>
      </section>

      {/* Featured / latest posts */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Newspaper className="size-5 text-primary" /> Tin tức & thông báo
          </h2>
          <Link
            href="/tin-tuc"
            className="text-sm font-medium text-primary hover:underline"
          >
            Tất cả
          </Link>
        </div>
        {allPosts.length === 0 ? (
          <EmptyState message="Chưa có bài viết nào được xuất bản." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allPosts.slice(0, 6).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                categoryName={categoryName(post.categoryId)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming events */}
      {events.length > 0 ? (
        <section className="space-y-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarClock className="size-5 text-primary" /> Sự kiện sắp tới
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-4 p-4">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="text-xs">
                    {formatDate(event.startDatetime, { month: "short" })}
                  </span>
                  <span className="text-base font-semibold leading-none">
                    {formatDate(event.startDatetime, { day: "2-digit" })}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {eventTypeLabels[event.eventType]} ·{" "}
                    {formatDate(event.startDatetime)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Albums */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Images className="size-5 text-primary" /> Thư viện
          </h2>
          <Link
            href="/thu-vien"
            className="text-sm font-medium text-primary hover:underline"
          >
            Tất cả
          </Link>
        </div>
        {albums.length === 0 ? (
          <EmptyState message="Chưa có album nào được xuất bản." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
