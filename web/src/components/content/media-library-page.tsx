"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  type MediaRecord,
  deleteMedia,
  getMediaList,
  mediaSrc,
  updateMedia,
  uploadMedia,
} from "@/lib/content";
import { formatDateTime } from "@/lib/date-time";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setMedia(await getMediaList());
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tải được media.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMediaList()
      .then((list) => {
        if (active) setMedia(list);
      })
      .catch((caught: unknown) => {
        toast.error(
          caught instanceof ApiError ? caught.message : "Không tải được media.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      toast.success(`Đã tải lên ${files.length} tệp.`);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không tải lên được.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.MEDIA_MANAGE]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Thư viện media"
            description="Tải lên và quản lý ảnh, tài liệu của dòng họ. Chấp nhận ảnh (≤5MB) và PDF (≤10MB)."
          />
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4" /> Tải lên
            </CardTitle>
            <CardDescription>Chọn một hoặc nhiều tệp ảnh/PDF.</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) void handleUpload(event.target.files);
                event.target.value = "";
              }}
            />
            <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <ImagePlus data-icon="inline-start" />
              )}
              Chọn tệp để tải lên
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tất cả media ({media.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : media.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có media nào.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {media.map((item) => (
                  <MediaCard key={item.id} item={item} onChanged={load} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

function MediaCard({
  item,
  onChanged,
}: {
  item: MediaRecord;
  onChanged: () => Promise<void> | void;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");

  const saveCaption = async () => {
    if ((item.caption ?? "") === caption) return;
    try {
      await updateMedia(item.id, { caption: caption.trim() });
      toast.success("Đã lưu chú thích.");
      await onChanged();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa mềm media này?")) return;
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
      <a
        href={mediaSrc(item.url)}
        target="_blank"
        rel="noreferrer"
        className="block aspect-square overflow-hidden rounded-md bg-muted"
      >
        {item.fileType === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaSrc(item.url)} alt={item.fileName} className="size-full object-cover" />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
            <FileText className="size-6" />
            {item.fileName}
          </span>
        )}
      </a>
      <div className="flex items-center justify-between gap-1">
        <Badge variant="secondary" className="text-[10px]">
          {item.fileType}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {formatSize(item.fileSize)}
        </span>
      </div>
      <Input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        onBlur={() => void saveCaption()}
        placeholder="Chú thích"
        className="h-7 text-xs"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {formatDateTime(item.createdAt)}
        </span>
        <Button size="xs" variant="ghost" onClick={() => void handleDelete()} aria-label="Xóa">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
