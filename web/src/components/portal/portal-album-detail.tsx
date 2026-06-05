"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/auth";
import { getPortalAlbum, mediaSrc, type AlbumWithMedia } from "@/lib/content";

export function PortalAlbumDetail({ albumId }: { albumId: string }) {
  const [data, setData] = useState<AlbumWithMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPortalAlbum(albumId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 404) {
          setNotFound(true);
        } else {
          setError(
            caught instanceof ApiError ? caught.message : "Không tải được album.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [albumId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy album</h1>
        <Link href="/thu-vien" className="text-primary hover:underline">
          ← Quay lại thư viện
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const { album, media } = data;
  const images = media.filter((item) => item.fileType === "IMAGE");
  const documents = media.filter((item) => item.fileType !== "IMAGE");

  return (
    <div className="space-y-6">
      <Link
        href="/thu-vien"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Thư viện
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {album.title}
        </h1>
        {album.description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {album.description}
          </p>
        ) : null}
      </div>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          Album chưa có tư liệu.
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((item) => (
            <a
              key={item.id}
              href={mediaSrc(item.url)}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaSrc(item.url)}
                alt={item.caption ?? item.fileName}
                className="aspect-square size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Tài liệu</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {documents.map((item) => (
              <li key={item.id}>
                <a
                  href={mediaSrc(item.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-muted/50"
                >
                  <FileText className="size-5 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.caption ?? item.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">Tải về</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
