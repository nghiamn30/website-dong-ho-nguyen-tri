"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-time";
import {
  approveChangeRequest,
  ChangeRequestRecord,
  changeRequestStatusLabels,
  changeRequestTypeLabels,
  getChangeRequest,
  rejectChangeRequest,
} from "@/lib/change-requests";

export function ChangeRequestDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const canReview = Boolean(
    user?.permissions.includes(PERMISSIONS.CHANGE_REQUESTS_REVIEW),
  );

  const [request, setRequest] = useState<ChangeRequestRecord | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getChangeRequest(id)
      .then((next) => {
        if (!mounted) return;
        setRequest(next);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (mounted) setError(getErrorMessage(caughtError));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const review = async (decision: "approve" | "reject") => {
    setIsSaving(true);
    try {
      const updated =
        decision === "approve"
          ? await approveChangeRequest(id, reviewNote.trim() || undefined)
          : await rejectChangeRequest(id, reviewNote.trim() || undefined);
      setRequest(updated);
      toast.success(
        decision === "approve"
          ? "Đã duyệt và cập nhật dữ liệu chính thức."
          : "Đã từ chối đề xuất.",
      );
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.CHANGE_REQUESTS_CREATE]}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/change-requests"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft data-icon="inline-start" />
            Danh sách
          </Link>
          <PageHeader title="Chi tiết đề xuất" description={`Mã: ${id}`} />
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Không tải được đề xuất</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-64 rounded-md" />
        ) : request ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {changeRequestTypeLabels[request.requestType]} thành viên
                  <Badge>{changeRequestStatusLabels[request.status]}</Badge>
                </CardTitle>
                <CardDescription>
                  Gửi lúc {formatDateTime(request.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Info label="Thực thể" value={request.entityType} />
                <Info label="Mã thực thể" value={request.entityId ?? "(tạo mới)"} />
                <Info label="Người gửi" value={request.requestedBy} />
                <Info label="Lý do" value={request.reason ?? "-"} />
                <div className="md:col-span-2 space-y-2">
                  <Label>Dữ liệu đề xuất</Label>
                  <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(request.proposedData, null, 2)}
                  </pre>
                </div>
                {request.status !== "PENDING" ? (
                  <>
                    <Info
                      label="Người duyệt"
                      value={request.reviewedBy ?? "-"}
                    />
                    <Info
                      label="Thời điểm duyệt"
                      value={
                        request.reviewedAt
                          ? formatDateTime(request.reviewedAt)
                          : "-"
                      }
                    />
                    <div className="md:col-span-2">
                      <Info
                        label="Ghi chú duyệt"
                        value={request.reviewNote ?? "-"}
                      />
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {canReview && request.status === "PENDING" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Duyệt đề xuất</CardTitle>
                  <CardDescription>
                    Duyệt sẽ cập nhật dữ liệu chính thức trong một giao dịch. Từ
                    chối không thay đổi dữ liệu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ghi chú duyệt (tuỳ chọn)</Label>
                    <Textarea
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      rows={3}
                      placeholder="Ghi chú cho quyết định duyệt/từ chối"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void review("approve")}
                    >
                      <Check data-icon="inline-start" />
                      Duyệt
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void review("reject")}
                    >
                      <X data-icon="inline-start" />
                      Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </ProtectedPage>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{value || "-"}</p>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không tải được chi tiết đề xuất.";
}
