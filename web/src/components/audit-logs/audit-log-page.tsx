"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  History,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AdvancedDataTable,
  type AdvancedDataTableColumn,
} from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import { formatDateTime as formatDateTimeInVietnam } from "@/lib/date-time";
import {
  AuditLogEntry,
  AuditLogSummary,
  getAuditLogSummary,
  getAuditLogs,
} from "@/lib/audit-logs";

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);

    try {
      const [nextLogs, nextSummary] = await Promise.all([
        getAuditLogs(),
        getAuditLogSummary(),
      ]);
      setLogs(nextLogs);
      setSummary(nextSummary);
      setError(null);
    } catch (caughtError) {
      setLogs([]);
      setSummary(null);
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchAuditLogData()
      .then(({ logs: nextLogs, summary: nextSummary }) => {
        if (!mounted) {
          return;
        }

        setLogs(nextLogs);
        setSummary(nextSummary);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!mounted) {
          return;
        }

        setLogs([]);
        setSummary(null);
        setError(getErrorMessage(caughtError));
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const latestLogs = useMemo(() => logs.slice(0, 100), [logs]);
  const columns = useMemo<AdvancedDataTableColumn<AuditLogEntry>[]>(
    () => [
      {
        id: "createdAt",
        header: "Thời điểm",
        accessor: "createdAt",
        cell: (entry) => formatDateTime(entry.createdAt),
        width: 190,
      },
      {
        id: "action",
        header: "Hành động",
        accessor: (entry) =>
          `${entry.action} ${entry.important ? "Quan trọng" : ""}`,
        cell: (entry) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{entry.action}</span>
            {entry.important ? (
              <Badge className="w-fit" variant="secondary">
                Quan trọng
              </Badge>
            ) : null}
          </div>
        ),
        width: 220,
      },
      {
        id: "employeeCode",
        header: "Tài khoản",
        accessor: (entry) => entry.employeeCode ?? "",
        cell: (entry) => entry.employeeCode ?? "-",
        width: 150,
      },
      {
        id: "success",
        header: "Kết quả",
        accessor: (entry) => (entry.success ? 1 : 0),
        cell: (entry) =>
          entry.success ? (
            <Badge className="gap-1" variant="secondary">
              <CheckCircle2 className="size-3" />
              Thành công
            </Badge>
          ) : (
            <Badge className="gap-1" variant="outline">
              <XCircle className="size-3" />
              Thất bại
            </Badge>
          ),
        width: 140,
      },
      {
        id: "metadata",
        header: "Metadata",
        accessor: (entry) => JSON.stringify(entry.metadata ?? {}),
        cell: (entry) => (
          <div className="max-w-[360px] whitespace-normal">
            {formatMetadata(entry.metadata)}
          </div>
        ),
        width: 360,
      },
    ],
    [],
  );

  return (
    <ProtectedPage permissions={[PERMISSIONS.AUDIT_LOGS_VIEW]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Nhật ký thao tác"
            description="Theo dõi đăng nhập, đăng xuất và các thay đổi quản trị quan trọng."
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadLogs()}
          >
            <RefreshCw data-icon="inline-start" />
            Tải lại
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Không tải được nhật ký</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tổng nhật ký" value={summary?.total} />
          <SummaryCard label="Quan trọng" value={summary?.important} />
          <SummaryCard label="Thất bại" value={summary?.failed} />
          <SummaryCard label="Giới hạn bộ nhớ" value={summary?.memoryLimit} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>100 sự kiện mới nhất</CardTitle>
            <CardDescription>
              Nhật ký hiện lưu trong bộ nhớ local, đủ cho kiểm thử trước khi
              bật database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && latestLogs.length === 0 ? (
              <LoadingRows />
            ) : latestLogs.length === 0 ? (
              <Alert>
                <History className="size-4" />
                <AlertTitle>Chưa có nhật ký</AlertTitle>
                <AlertDescription>
                  Đăng nhập, đăng xuất hoặc thay đổi cấu hình quản trị để tạo sự kiện.
                </AlertDescription>
              </Alert>
            ) : (
              <AdvancedDataTable
                columns={columns}
                data={latestLogs}
                emptyMessage="Chưa có nhật ký phù hợp."
                getRowId={(entry) => entry.id}
                stateStorageKey="audit-logs"
                stickyHeader
                virtualized
                paginationMode="pagination"
                pageSizeOptions={[25, 50, 100]}
                maxHeight={620}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value ?? "-"}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
    </div>
  );
}

function formatDateTime(value: string) {
  return formatDateTimeInVietnam(value, { timeStyle: "medium" });
}

function formatMetadata(metadata?: Record<string, unknown>) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <code className="break-words rounded bg-muted px-1 py-0.5 text-xs">
      {JSON.stringify(metadata)}
    </code>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không tải được nhật ký thao tác.";
}

async function fetchAuditLogData() {
  const [logs, summary] = await Promise.all([
    getAuditLogs(),
    getAuditLogSummary(),
  ]);

  return { logs, summary };
}
