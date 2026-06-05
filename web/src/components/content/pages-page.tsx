"use client";

import { useEffect, useState } from "react";
import { FileText, Save } from "lucide-react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import { getPage, PAGE_KEYS, updatePage } from "@/lib/content";

const PAGE_SECTIONS: { key: string; label: string; defaultTitle: string }[] = [
  { key: PAGE_KEYS.ABOUT, label: "Giới thiệu chung", defaultTitle: "Giới thiệu dòng họ" },
  { key: PAGE_KEYS.HISTORY, label: "Lịch sử", defaultTitle: "Lịch sử dòng họ" },
  { key: PAGE_KEYS.ANCESTOR, label: "Thủy tổ", defaultTitle: "Thủy tổ" },
  {
    key: PAGE_KEYS.ANCESTRAL_HOUSE,
    label: "Từ đường",
    defaultTitle: "Từ đường dòng họ",
  },
];

export function ContentPagesPage() {
  const [activeKey, setActiveKey] = useState(PAGE_SECTIONS[0].key);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const section = PAGE_SECTIONS.find((item) => item.key === activeKey)!;

  useEffect(() => {
    let active = true;
    getPage(activeKey)
      .then((page) => {
        if (!active) return;
        setTitle(page?.title ?? section.defaultTitle);
        setContent(page?.content ?? "");
      })
      .catch(() => {
        if (active) {
          setTitle(section.defaultTitle);
          setContent("");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Cần nhập tiêu đề.");
      return;
    }
    setIsSaving(true);
    try {
      await updatePage(activeKey, {
        title: title.trim(),
        content: content.trim() || undefined,
      });
      toast.success("Đã lưu nội dung trang.");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.PAGES_MANAGE]}>
      <div className="space-y-6">
        <PageHeader
          title="Nội dung trang giới thiệu"
          description="Cập nhật nội dung các trang giới thiệu, lịch sử, thủy tổ và từ đường hiển thị trên cổng thông tin."
        />

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <Card className="h-fit">
            <CardContent className="p-2">
              <nav className="flex gap-1 overflow-x-auto lg:flex-col">
                {PAGE_SECTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveKey(item.key)}
                    className={cn(
                      "shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted",
                      activeKey === item.key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" /> {section.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="page-title">Tiêu đề</Label>
                    <Input
                      id="page-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="page-content">Nội dung</Label>
                    <Textarea
                      id="page-content"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      className="min-h-72"
                      placeholder="Nhập nội dung giới thiệu..."
                    />
                  </div>
                  <Button onClick={() => void handleSave()} disabled={isSaving}>
                    <Save data-icon="inline-start" /> Lưu nội dung
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedPage>
  );
}
