"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/auth";
import { getPortalPage, type PageContentRecord } from "@/lib/content";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/gioi-thieu", label: "Giới thiệu chung" },
  { href: "/gioi-thieu/lich-su", label: "Lịch sử" },
  { href: "/gioi-thieu/thuy-to", label: "Thủy tổ" },
  { href: "/gioi-thieu/tu-duong", label: "Từ đường" },
];

export function PortalIntroPage({
  pageKey,
  fallbackTitle,
}: {
  pageKey: string;
  fallbackTitle: string;
}) {
  const pathname = usePathname();
  const [page, setPage] = useState<PageContentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPortalPage(pageKey)
      .then((result) => {
        if (active) setPage(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof ApiError ? caught.message : "Không tải được nội dung.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pageKey]);

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:border-r lg:pr-6">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === section.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>

      <article className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {page?.title ?? fallbackTitle}
        </h1>
        <div className="mt-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : page?.content ? (
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
              {page.content}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              Nội dung đang được cập nhật.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
