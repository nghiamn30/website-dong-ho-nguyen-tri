"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Images,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  type AlbumRecord,
  type AlbumWithMedia,
  type ContentStatus,
  type ContentVisibility,
  type MediaRecord,
  contentStatusLabels,
  createAlbum,
  deleteAlbum,
  deleteMedia,
  getAlbum,
  getAlbums,
  mediaSrc,
  updateAlbum,
  updateMedia,
  uploadMedia,
  visibilityLabels,
} from "@/lib/content";

const STATUSES: ContentStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN"];
const VISIBILITIES: ContentVisibility[] = [
  "PUBLIC",
  "MEMBERS",
  "BRANCH",
  "LEADERSHIP",
];

export function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AlbumWithMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadAlbums = useCallback(async () => {
    try {
      const list = await getAlbums();
      setAlbums(list);
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không tải được album.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetail(await getAlbum(id));
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không tải được album.",
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAlbums()
      .then((list) => {
        if (active) setAlbums(list);
      })
      .catch((caught: unknown) => {
        toast.error(
          caught instanceof ApiError ? caught.message : "Không tải được album.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getAlbum(selectedId)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((caught: unknown) => {
        toast.error(
          caught instanceof ApiError ? caught.message : "Không tải được album.",
        );
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Cần nhập tên album.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await createAlbum({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Đã tạo album.");
      setTitle("");
      setDescription("");
      await loadAlbums();
      setSelectedId(created.id);
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tạo được album.");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshAll = async () => {
    await loadAlbums();
    if (selectedId) await loadDetail(selectedId);
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.ALBUMS_MANAGE]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Album & tư liệu"
            description="Tạo album ảnh/tài liệu theo sự kiện, chi/nhánh hoặc chủ đề và quản lý media bên trong."
          />
          <Button variant="ghost" size="icon" onClick={() => void refreshAll()} aria-label="Tải lại">
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="size-4" /> Tạo album
                </CardTitle>
                <CardDescription>Album mới ở trạng thái nháp.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleCreate}>
                  <div className="space-y-1">
                    <Label htmlFor="album-title">Tên album</Label>
                    <Input
                      id="album-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Lễ giỗ tổ 2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="album-desc">Mô tả</Label>
                    <Textarea
                      id="album-desc"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSaving}>
                    Tạo album
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Danh sách album</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : albums.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có album.</p>
                ) : (
                  <ul className="space-y-1">
                    {albums.map((album) => (
                      <li key={album.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(album.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                            selectedId === album.id ? "bg-muted" : "",
                          )}
                        >
                          <span className="min-w-0 truncate font-medium">
                            {album.title}
                          </span>
                          <Badge
                            variant={
                              album.status === "PUBLISHED" ? "default" : "secondary"
                            }
                            className="text-[11px]"
                          >
                            {contentStatusLabels[album.status]}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            {detail ? (
              <AlbumDetailPanel
                key={detail.album.id}
                detail={detail}
                onChanged={refreshAll}
                onDeleted={() => {
                  setSelectedId(null);
                  setDetail(null);
                  void loadAlbums();
                }}
              />
            ) : (
              <Card>
                <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Images className="size-8 opacity-40" />
                  Chọn một album để quản lý ảnh và tài liệu.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

function AlbumDetailPanel({
  detail,
  onChanged,
  onDeleted,
}: {
  detail: AlbumWithMedia;
  onChanged: () => Promise<void> | void;
  onDeleted: () => void;
}) {
  const { album, media } = detail;
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description ?? "");
  const [status, setStatus] = useState<ContentStatus>(album.status);
  const [visibility, setVisibility] = useState<ContentVisibility>(
    album.visibilityScope,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveAlbum = async () => {
    setIsSaving(true);
    try {
      await updateAlbum(album.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        visibilityScope: visibility,
      });
      toast.success("Đã lưu album.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!window.confirm(`Xóa album "${album.title}"?`)) return;
    try {
      await deleteAlbum(album.id);
      toast.success("Đã xóa album.");
      onDeleted();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadMedia(file, { albumId: album.id });
      toast.success("Đã tải media lên album.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tải lên được.");
    } finally {
      setIsUploading(false);
    }
  };

  const setCover = async (mediaId: string) => {
    try {
      await updateAlbum(album.id, { coverMediaId: mediaId });
      toast.success("Đã đặt ảnh đại diện.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin album</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="ad-title">Tên album</Label>
            <Input
              id="ad-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="ad-desc">Mô tả</Label>
            <Textarea
              id="ad-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ContentStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contentStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Phạm vi hiển thị</Label>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as ContentVisibility)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {visibilityLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Button onClick={() => void saveAlbum()} disabled={isSaving}>
              Lưu album
            </Button>
            <Button variant="ghost" onClick={() => void handleDeleteAlbum()}>
              <Trash2 data-icon="inline-start" /> Xóa album
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Media trong album ({media.length})</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <Button
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <ImagePlus data-icon="inline-start" />
              )}
              Tải lên
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Album chưa có media. Tải ảnh hoặc tài liệu lên.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {media.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  isCover={album.coverMediaId === item.id}
                  onSetCover={() => void setCover(item.id)}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MediaTile({
  item,
  isCover,
  onSetCover,
  onChanged,
}: {
  item: MediaRecord;
  isCover: boolean;
  onSetCover: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");

  const saveCaption = async () => {
    try {
      await updateMedia(item.id, { caption: caption.trim() });
      toast.success("Đã lưu chú thích.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa media này khỏi album?")) return;
    try {
      await deleteMedia(item.id);
      toast.success("Đã xóa media.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-2">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        {item.fileType === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaSrc(item.url)} alt={item.fileName} className="size-full object-cover" />
        ) : (
          <a
            href={mediaSrc(item.url)}
            target="_blank"
            rel="noreferrer"
            className="flex size-full items-center justify-center text-xs text-muted-foreground"
          >
            {item.fileName}
          </a>
        )}
        {isCover ? (
          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            Ảnh đại diện
          </span>
        ) : null}
      </div>
      <Input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        onBlur={() => {
          if ((item.caption ?? "") !== caption) void saveCaption();
        }}
        placeholder="Chú thích"
        className="h-7 text-xs"
      />
      <div className="flex items-center justify-between">
        <Button
          size="xs"
          variant="outline"
          disabled={isCover || item.fileType !== "IMAGE"}
          onClick={onSetCover}
        >
          <Star className="size-3" /> Đại diện
        </Button>
        <Button size="xs" variant="ghost" onClick={() => void handleDelete()} aria-label="Xóa">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
