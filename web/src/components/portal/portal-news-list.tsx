"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/pages/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/portal/post-card";
import { ApiError } from "@/lib/auth";
import {
  getPortalCategories,
  getPortalPosts,
  type CategoryRecord,
  type PostRecord,
} from "@/lib/content";
import { cn } from "@/lib/utils";

export function PortalNewsList() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPortalPosts(activeCategory ?? undefined),
      getPortalCategories().catch(() => [] as CategoryRecord[]),
    ])
      .then(([postList, categoryList]) => {
        if (!active) return;
        setPosts(postList);
        setCategories(categoryList);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được tin tức.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeCategory]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [categories]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tức & thông báo"
        description="Thông báo, hoạt động, tin vui, tin buồn và tư liệu của dòng họ."
      />

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Tất cả"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          Chưa có bài viết nào trong mục này.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              categoryName={categoryName(post.categoryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
