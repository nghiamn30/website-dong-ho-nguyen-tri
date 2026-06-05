"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/pages/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/portal/album-card";
import { ApiError } from "@/lib/auth";
import { getPortalAlbums, type AlbumSummary } from "@/lib/content";

export function PortalGalleryList() {
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPortalAlbums()
      .then((result) => {
        if (active) setAlbums(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof ApiError ? caught.message : "Không tải được thư viện.",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thư viện"
        description="Album ảnh và tư liệu theo sự kiện, chi/nhánh hoặc chủ đề của dòng họ."
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : albums.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          Chưa có album nào được xuất bản.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
