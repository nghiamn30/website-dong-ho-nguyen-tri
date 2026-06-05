"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus, RefreshCw, TriangleAlert } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-time";
import {
  ChangeRequestRecord,
  ChangeRequestStatus,
  ChangeRequestType,
  changeRequestStatusLabels,
  changeRequestTypeLabels,
  createChangeRequest,
  getChangeRequests,
} from "@/lib/change-requests";
import { getPersons, PersonRecord } from "@/lib/genealogy";

const statusBadgeVariant: Record<
  ChangeRequestStatus,
  "secondary" | "outline" | "default"
> = {
  PENDING: "default",
  APPROVED: "secondary",
  REJECTED: "outline",
};

type StatusFilter = ChangeRequestStatus | "ALL";

export function ChangeRequestsPage() {
  const { user } = useAuth();
  const canReview = Boolean(
    user?.permissions.includes(PERMISSIONS.CHANGE_REQUESTS_REVIEW),
  );

  const [requests, setRequests] = useState<ChangeRequestRecord[]>([]);
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextRequests, nextPersons] = await Promise.all([
        getChangeRequests(
          statusFilter === "ALL" ? {} : { status: statusFilter },
        ),
        getPersons(),
      ]);
      setRequests(nextRequests);
      setPersons(nextPersons);
      setError(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const filter = statusFilter === "ALL" ? {} : { status: statusFilter };
    Promise.all([getChangeRequests(filter), getPersons()])
      .then(([nextRequests, nextPersons]) => {
        if (!mounted) return;
        setRequests(nextRequests);
        setPersons(nextPersons);
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
  }, [statusFilter]);

  const personsById = useMemo(
    () => new Map(persons.map((person) => [person.id, person])),
    [persons],
  );

  return (
    <ProtectedPage permissions={[PERMISSIONS.CHANGE_REQUESTS_CREATE]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Đề xuất chỉnh sửa"
            description={
              canReview
                ? "Xem và duyệt các đề xuất chỉnh sửa dữ liệu thành viên."
                : "Gửi đề xuất chỉnh sửa và theo dõi trạng thái duyệt."
            }
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => void loadData()}
            >
              <RefreshCw data-icon="inline-start" />
              Tải lại
            </Button>
            <CreateRequestDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              persons={persons}
              onCreated={() => {
                setDialogOpen(false);
                void loadData();
              }}
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Có lỗi xảy ra</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Danh sách đề xuất</CardTitle>
              <CardDescription>
                {canReview
                  ? "Hiển thị tất cả đề xuất trong hệ thống."
                  : "Hiển thị các đề xuất bạn đã gửi."}
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter((value ?? "ALL") as StatusFilter)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            ) : requests.length === 0 ? (
              <Alert>
                <ClipboardCheck className="size-4" />
                <AlertTitle>Chưa có đề xuất</AlertTitle>
                <AlertDescription>
                  Nhấn “Gửi đề xuất” để tạo đề xuất chỉnh sửa đầu tiên.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                      <TableCell>
                        {changeRequestTypeLabels[request.requestType]}
                      </TableCell>
                      <TableCell>
                        {request.entityId
                          ? personsById.get(request.entityId)?.fullName ??
                            request.entityId
                          : "(tạo mới)"}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {request.reason ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[request.status]}>
                          {changeRequestStatusLabels[request.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/change-requests/${request.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Xem
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

function CreateRequestDialog({
  open,
  onOpenChange,
  persons,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persons: PersonRecord[];
  onCreated: () => void;
}) {
  const [requestType, setRequestType] = useState<ChangeRequestType>("UPDATE");
  const [entityId, setEntityId] = useState("");
  const [proposedDataText, setProposedDataText] = useState(
    '{\n  "fullName": ""\n}',
  );
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    let proposedData: Record<string, unknown>;
    try {
      proposedData = JSON.parse(proposedDataText) as Record<string, unknown>;
    } catch {
      toast.error("Dữ liệu đề xuất phải là JSON hợp lệ.");
      return;
    }

    if (requestType !== "CREATE" && !entityId) {
      toast.error("Chọn thành viên cho đề xuất sửa/xoá.");
      return;
    }

    setIsSaving(true);
    try {
      await createChangeRequest({
        entityType: "person",
        entityId: requestType === "CREATE" ? undefined : entityId,
        requestType,
        proposedData,
        reason: reason.trim() || undefined,
      });
      toast.success("Đã gửi đề xuất chỉnh sửa.");
      setEntityId("");
      setReason("");
      onCreated();
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => onOpenChange(true)}>
        <Plus data-icon="inline-start" />
        Gửi đề xuất
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Gửi đề xuất chỉnh sửa</DialogTitle>
            <DialogDescription>
              Đề xuất sẽ được trưởng họ/admin duyệt trước khi cập nhật dữ liệu
              chính thức.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Loại đề xuất</Label>
              <Select
                value={requestType}
                onValueChange={(value) =>
                  setRequestType(value as ChangeRequestType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPDATE">Cập nhật thành viên</SelectItem>
                  <SelectItem value="CREATE">Tạo thành viên mới</SelectItem>
                  <SelectItem value="DELETE">Xoá thành viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requestType !== "CREATE" ? (
              <div className="space-y-2">
                <Label>Thành viên</Label>
                <Select
                  value={entityId}
                  onValueChange={(value) => setEntityId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Dữ liệu đề xuất (JSON)</Label>
              <Textarea
                value={proposedDataText}
                onChange={(event) => setProposedDataText(event.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Ví dụ: {'{ "fullName": "Nguyễn Văn An", "hometown": "Hà Nội" }'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Lý do</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                placeholder="Mô tả lý do đề xuất"
              />
            </div>
          </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                Gửi đề xuất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không tải được danh sách đề xuất.";
}
