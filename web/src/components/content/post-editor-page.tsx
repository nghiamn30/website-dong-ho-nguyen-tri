"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  type CategoryRecord,
  type ContentStatus,
  type ContentVisibility,
  type PostPayload,
  contentStatusLabels,
  createPost,
  getCategories,
  getPost,
  resolveImageUrl,
  updatePost,
  uploadMedia,
  visibilityLabels,
} from "@/lib/content";
import { type EventRecord, getEvents } from "@/lib/calendar";
import { type BranchRecord, getBranches } from "@/lib/genealogy";
import { formatDate } from "@/lib/date-time";

const NONE = "__none__";
const VISIBILITIES: ContentVisibility[] = [
  "PUBLIC",
  "MEMBERS",
  "BRANCH",
  "LEADERSHIP",
];

interface FormState {
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string;
  categoryId: string;
  branchId: string;
  relatedEventId: string;
  visibilityScope: ContentVisibility;
  status: ContentStatus;
}

const EMPTY: FormState = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  thumbnailUrl: "",
  categoryId: NONE,
  branchId: NONE,
  relatedEventId: NONE,
  visibilityScope: "PUBLIC",
  status: "DRAFT",
};

export function PostEditorPage({
  mode,
  postId,
}: {
  mode: "create" | "edit";
  postId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const canPublish = Boolean(user?.permissions.includes(PERMISSIONS.POSTS_PUBLISH));

  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getCategories(true).catch(() => [] as CategoryRecord[]),
      getBranches().catch(() => [] as BranchRecord[]),
      getEvents({ status: "PUBLISHED" }).catch(() => [] as EventRecord[]),
      mode === "edit" && postId ? getPost(postId) : Promise.resolve(null),
    ])
      .then(([categoryList, branchList, eventList, post]) => {
        if (!active) return;
        setCategories(categoryList);
        setBranches(branchList);
        setEvents(eventList);
        if (post) {
          setForm({
            title: post.title,
            slug: post.slug,
            summary: post.summary ?? "",
            content: post.content ?? "",
            thumbnailUrl: post.thumbnailUrl ?? "",
            categoryId: post.categoryId ?? NONE,
            branchId: post.branchId ?? NONE,
            relatedEventId: post.relatedEventId ?? NONE,
            visibilityScope: post.visibilityScope,
            status: post.status,
          });
        }
      })
      .catch((caught: unknown) => {
        toast.error(
          caught instanceof ApiError ? caught.message : "Không tải được dữ liệu.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, postId]);

  const buildPayload = (status: ContentStatus): PostPayload => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    summary: form.summary.trim() || undefined,
    content: form.content.trim() || undefined,
    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    categoryId: form.categoryId === NONE ? undefined : form.categoryId,
    branchId: form.branchId === NONE ? undefined : form.branchId,
    relatedEventId:
      form.relatedEventId === NONE ? undefined : form.relatedEventId,
    visibilityScope: form.visibilityScope,
    status,
  });

  const handleSave = async (status: ContentStatus) => {
    if (!form.title.trim()) {
      toast.error("Cần nhập tiêu đề bài viết.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload(status);
      if (mode === "create") {
        const created = await createPost(payload);
        toast.success(
          created.status === "PUBLISHED"
            ? "Đã tạo và xuất bản bài viết."
            : "Đã lưu bài viết.",
        );
        router.push(`/content/posts/${created.id}`);
      } else if (postId) {
        const updated = await updatePost(postId, payload);
        update({ status: updated.status });
        toast.success("Đã lưu thay đổi.");
      }
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadThumbnail = async (file: File) => {
    setIsUploading(true);
    try {
      const media = await uploadMedia(file, { caption: form.title || file.name });
      update({ thumbnailUrl: media.url });
      toast.success("Đã tải ảnh đại diện lên.");
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không tải được ảnh.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.POSTS_MANAGE]}>
      <div className="space-y-6">
        <Link
          href="/content/posts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Danh sách bài viết
        </Link>

        <PageHeader
          title={mode === "create" ? "Tạo bài viết" : "Chỉnh sửa bài viết"}
          description="Tiêu đề, nội dung, chuyên mục, phạm vi hiển thị và liên kết sự kiện."
        />

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-1">
                    <Label htmlFor="post-title">Tiêu đề</Label>
                    <Input
                      id="post-title"
                      value={form.title}
                      onChange={(event) => update({ title: event.target.value })}
                      placeholder="Ví dụ: Thông báo họp họ đầu xuân"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-slug">Slug (tùy chọn)</Label>
                    <Input
                      id="post-slug"
                      value={form.slug}
                      onChange={(event) => update({ slug: event.target.value })}
                      placeholder="Tự sinh từ tiêu đề nếu để trống"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-summary">Tóm tắt</Label>
                    <Textarea
                      id="post-summary"
                      value={form.summary}
                      onChange={(event) => update({ summary: event.target.value })}
                      placeholder="Mô tả ngắn hiển thị ở danh sách tin tức."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-content">Nội dung</Label>
                    <Textarea
                      id="post-content"
                      value={form.content}
                      onChange={(event) => update({ content: event.target.value })}
                      className="min-h-72"
                      placeholder="Nội dung bài viết..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Xuất bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Trạng thái</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        update({ status: value as ContentStatus })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["DRAFT", "PUBLISHED", "HIDDEN"] as ContentStatus[]).map(
                          (status) => (
                            <SelectItem key={status} value={status}>
                              {contentStatusLabels[status]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {!canPublish ? (
                    <p className="text-xs text-muted-foreground">
                      Bạn chỉ lưu được bản nháp; trưởng họ/admin sẽ xuất bản.
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => void handleSave(form.status)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                      ) : (
                        <Save data-icon="inline-start" />
                      )}
                      {mode === "create" ? "Lưu bài viết" : "Lưu thay đổi"}
                    </Button>
                    {canPublish && form.status !== "PUBLISHED" ? (
                      <Button
                        variant="outline"
                        onClick={() => void handleSave("PUBLISHED")}
                        disabled={isSaving}
                      >
                        Lưu & xuất bản
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Phân loại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Chuyên mục</Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(value) => update({ categoryId: value ?? NONE })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn chuyên mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Chưa phân loại</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Phạm vi hiển thị</Label>
                    <Select
                      value={form.visibilityScope}
                      onValueChange={(value) =>
                        update({ visibilityScope: value as ContentVisibility })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITIES.map((visibility) => (
                          <SelectItem key={visibility} value={visibility}>
                            {visibilityLabels[visibility]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Chi/nhánh</Label>
                    <Select
                      value={form.branchId}
                      onValueChange={(value) => update({ branchId: value ?? NONE })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Toàn họ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Toàn họ</SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Liên kết sự kiện</Label>
                    <Select
                      value={form.relatedEventId}
                      onValueChange={(value) => update({ relatedEventId: value ?? NONE })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Không liên kết" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Không liên kết</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} · {formatDate(event.startDatetime)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ảnh đại diện</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(form.thumbnailUrl)}
                      alt="Ảnh đại diện"
                      className="aspect-[16/9] w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      Chưa có ảnh
                    </div>
                  )}
                  <Input
                    value={form.thumbnailUrl}
                    onChange={(event) => update({ thumbnailUrl: event.target.value })}
                    placeholder="Dán URL ảnh hoặc tải lên"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUploadThumbnail(file);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <ImagePlus data-icon="inline-start" />
                    )}
                    Tải ảnh lên
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
