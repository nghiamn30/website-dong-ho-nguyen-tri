"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Pin, PinOff, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  type CategoryRecord,
  type ContentStatus,
  type PostRecord,
  contentStatusLabels,
  deletePost,
  getCategories,
  getPosts,
  hidePost,
  publishPost,
  setPostPinned,
  visibilityLabels,
} from "@/lib/content";
import { formatDateTime } from "@/lib/date-time";

const statusVariants: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  HIDDEN: "outline",
};

const STATUS_FILTERS: Array<ContentStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
];

export function PostsListPage() {
  const { user } = useAuth();
  const canPublish = Boolean(user?.permissions.includes(PERMISSIONS.POSTS_PUBLISH));

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [postList, categoryList] = await Promise.all([
        getPosts({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: search.trim() || undefined,
        }),
        getCategories().catch(() => [] as CategoryRecord[]),
      ]);
      setPosts(postList);
      setCategories(categoryList);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được bài viết.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPosts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
      getCategories().catch(() => [] as CategoryRecord[]),
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
          caught instanceof ApiError ? caught.message : "Không tải được bài viết.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, search]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [categories]);

  const handlePublish = async (post: PostRecord) => {
    try {
      await publishPost(post.id);
      toast.success("Đã xuất bản bài viết.");
      await load();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không xuất bản được.",
      );
    }
  };

  const handleHide = async (post: PostRecord) => {
    try {
      await hidePost(post.id);
      toast.success("Đã ẩn bài viết.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không ẩn được.");
    }
  };

  const handlePin = async (post: PostRecord) => {
    try {
      await setPostPinned(post.id, !post.isPinned);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  const handleDelete = async (post: PostRecord) => {
    if (!window.confirm(`Xóa bài viết "${post.title}"?`)) {
      return;
    }
    try {
      await deletePost(post.id);
      toast.success("Đã xóa bài viết.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.POSTS_MANAGE]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Bài viết"
            description="Soạn, lưu nháp, xuất bản, ẩn và ghim bài viết của dòng họ."
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
              <RefreshCw className="size-4" />
            </Button>
            <Button render={<Link href="/content/posts/new" />}>
              <Plus data-icon="inline-start" /> Tạo bài
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-base">Danh sách bài viết</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as ContentStatus | "ALL")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "ALL" ? "Tất cả trạng thái" : contentStatusLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tiêu đề..."
                className="w-56"
              />
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có bài viết nào. Nhấn “Tạo bài” để bắt đầu.
              </p>
            ) : (
              <ul className="divide-y">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/content/posts/${post.id}`}
                          className="font-medium hover:underline"
                        >
                          {post.title}
                        </Link>
                        <Badge variant={statusVariants[post.status]} className="text-[11px]">
                          {contentStatusLabels[post.status]}
                        </Badge>
                        {post.isPinned ? (
                          <Badge variant="outline" className="text-[11px]">
                            <Pin className="mr-1 size-3" /> Ghim
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {categoryName(post.categoryId) ?? "Chưa phân loại"} ·{" "}
                        {visibilityLabels[post.visibilityScope]} ·{" "}
                        {formatDateTime(post.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canPublish && post.status !== "PUBLISHED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handlePublish(post)}
                        >
                          Xuất bản
                        </Button>
                      ) : null}
                      {post.status === "PUBLISHED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleHide(post)}
                        >
                          Ẩn
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handlePin(post)}
                        aria-label={post.isPinned ? "Bỏ ghim" : "Ghim"}
                      >
                        {post.isPinned ? (
                          <PinOff className="size-4" />
                        ) : (
                          <Pin className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        render={<Link href={`/content/posts/${post.id}`} />}
                        aria-label="Sửa"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleDelete(post)}
                        aria-label="Xóa"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
