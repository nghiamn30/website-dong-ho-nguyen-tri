"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/auth";
import { getPortalPost, resolveImageUrl, type PostRecord } from "@/lib/content";
import { formatDate } from "@/lib/date-time";

export function PortalPostDetail({ slug }: { slug: string }) {
  const [post, setPost] = useState<PostRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPortalPost(slug)
      .then((result) => {
        if (active) setPost(result);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 404) {
          setNotFound(true);
        } else {
          setError(
            caught instanceof ApiError ? caught.message : "Không tải được bài viết.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy bài viết</h1>
        <p className="text-muted-foreground">
          Bài viết có thể chưa được xuất bản hoặc không công khai.
        </p>
        <Link href="/tin-tuc" className="text-primary hover:underline">
          ← Quay lại tin tức
        </Link>
      </div>
    );
  }

  if (error || !post) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/tin-tuc"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tin tức
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {post.publishedAt ? formatDate(post.publishedAt) : ""}
      </p>

      {post.thumbnailUrl ? (
        <div className="mt-6 overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(post.thumbnailUrl)}
            alt={post.title}
            className="w-full object-cover"
          />
        </div>
      ) : null}

      {post.summary ? (
        <p className="mt-6 text-lg leading-8 text-foreground/80">{post.summary}</p>
      ) : null}

      {post.content ? (
        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
          {post.content}
        </div>
      ) : null}
    </article>
  );
}
