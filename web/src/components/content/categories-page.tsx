"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FolderTree, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  type CategoryRecord,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/content";

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await getCategories());
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được chuyên mục.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((list) => {
        if (!active) return;
        setCategories(list);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Không tải được chuyên mục.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Cần nhập tên chuyên mục.");
      return;
    }
    setIsSaving(true);
    try {
      await createCategory({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success("Đã tạo chuyên mục.");
      setName("");
      setSlug("");
      setDescription("");
      await load();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không tạo được chuyên mục.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (category: CategoryRecord) => {
    try {
      await updateCategory(category.id, { active: !category.active });
      await load();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không cập nhật được.",
      );
    }
  };

  const handleDelete = async (category: CategoryRecord) => {
    if (!window.confirm(`Xóa chuyên mục "${category.name}"?`)) {
      return;
    }
    try {
      await deleteCategory(category.id);
      toast.success("Đã xóa chuyên mục.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.CATEGORIES_MANAGE]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Chuyên mục nội dung"
            description="Phân loại bài viết: thông báo, hoạt động, tin vui, tin buồn, tư liệu, văn bản."
          />
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="size-4" /> Thêm chuyên mục
              </CardTitle>
              <CardDescription>Slug để trống sẽ tự sinh từ tên.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleCreate}>
                <div className="space-y-1">
                  <Label htmlFor="cat-name">Tên</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Thông báo"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-slug">Slug (tùy chọn)</Label>
                  <Input
                    id="cat-slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="thong-bao"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-desc">Mô tả</Label>
                  <Textarea
                    id="cat-desc"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSaving}>
                  Tạo chuyên mục
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderTree className="size-4" /> Danh sách chuyên mục
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có chuyên mục.</p>
              ) : (
                <ul className="divide-y">
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-[11px]">
                            /{category.slug}
                          </Badge>
                          {!category.active ? (
                            <Badge variant="secondary" className="text-[11px]">
                              Ẩn
                            </Badge>
                          ) : null}
                        </div>
                        {category.description ? (
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.active}
                          onCheckedChange={() => void handleToggleActive(category)}
                          aria-label="Bật/tắt hiển thị"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(category)}
                        >
                          <Pencil className="size-3.5" /> Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleDelete(category)}
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
      </div>

      <EditCategoryDialog
        key={editing?.id ?? "none"}
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </ProtectedPage>
  );
}

function EditCategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(category?.displayOrder ?? 0),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!category) return;
    setIsSaving(true);
    try {
      await updateCategory(category.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        displayOrder: Number(displayOrder) || 0,
      });
      toast.success("Đã cập nhật chuyên mục.");
      onSaved();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Không cập nhật được.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(category)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa chuyên mục</DialogTitle>
          <DialogDescription>Cập nhật tên, slug và thứ tự hiển thị.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-cat-name">Tên</Label>
            <Input
              id="edit-cat-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cat-slug">Slug</Label>
            <Input
              id="edit-cat-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cat-order">Thứ tự hiển thị</Label>
            <Input
              id="edit-cat-order"
              type="number"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cat-desc">Mô tả</Label>
            <Textarea
              id="edit-cat-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
