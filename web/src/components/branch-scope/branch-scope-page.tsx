"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  assignBranchScope,
  BranchScopedRoleRecord,
  getBranchScopes,
  removeBranchScope,
} from "@/lib/branch-scopes";
import { BranchRecord, getBranches } from "@/lib/genealogy";
import { getUsers, ManagedUser } from "@/lib/users";

const scopedRoleLabels: Record<string, string> = {
  TRUONG_CHI: "Trưởng chi",
  NGUOI_BINH_THUONG: "Người bình thường",
};

export function BranchScopePage() {
  const [scopes, setScopes] = useState<BranchScopedRoleRecord[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [userId, setUserId] = useState("");
  const [roleCode, setRoleCode] = useState("TRUONG_CHI");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextScopes, nextUsers, nextBranches] = await Promise.all([
        getBranchScopes(),
        getUsers(),
        getBranches(),
      ]);
      setScopes(nextScopes);
      setUsers(nextUsers);
      setBranches(nextBranches);
      setError(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([getBranchScopes(), getUsers(), getBranches()])
      .then(([nextScopes, nextUsers, nextBranches]) => {
        if (!mounted) return;
        setScopes(nextScopes);
        setUsers(nextUsers);
        setBranches(nextBranches);
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
  }, []);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const branchesById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch])),
    [branches],
  );
  const scopedUsers = useMemo(
    () =>
      users.filter((user) =>
        user.roles.some(
          (role) => role.code === "TRUONG_CHI" || role.code === "NGUOI_BINH_THUONG",
        ),
      ),
    [users],
  );

  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || !branchId) {
      toast.error("Chọn đủ người dùng và chi/nhánh.");
      return;
    }
    setIsSaving(true);
    try {
      await assignBranchScope({ userId, roleCode, branchId });
      toast.success("Đã gán phạm vi chi cho người dùng.");
      setBranchId("");
      await loadData();
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeBranchScope(id);
      toast.success("Đã gỡ phạm vi chi.");
      setScopes((current) => current.filter((scope) => scope.id !== id));
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.ROLES_MANAGE_BRANCH_SCOPE]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Phân quyền theo chi/nhánh"
            description="Gán phạm vi chi/nhánh cho trưởng chi. Phạm vi gồm cả các chi con."
          />
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
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Có lỗi xảy ra</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Gán phạm vi mới</CardTitle>
            <CardDescription>
              Trưởng chi chỉ thao tác được trong chi được gán; admin và trưởng họ
              luôn có phạm vi toàn họ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
              onSubmit={handleAssign}
            >
              <div className="space-y-2">
                <Label>Người dùng</Label>
                <Select
                  value={userId}
                  onValueChange={(value) => setUserId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người dùng" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopedUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select
                  value={roleCode}
                  onValueChange={(value) => setRoleCode(value ?? "TRUONG_CHI")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUONG_CHI">Trưởng chi</SelectItem>
                    <SelectItem value="NGUOI_BINH_THUONG">
                      Người bình thường
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chi/nhánh</Label>
                <Select
                  value={branchId}
                  onValueChange={(value) => setBranchId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chi/nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSaving}>
                <Plus data-icon="inline-start" />
                Gán
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách phân quyền theo chi</CardTitle>
            <CardDescription>
              Mỗi dòng là một chi/nhánh được gán cho người dùng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            ) : scopes.length === 0 ? (
              <Alert>
                <ShieldCheck className="size-4" />
                <AlertTitle>Chưa có phân quyền theo chi</AlertTitle>
                <AlertDescription>
                  Dùng biểu mẫu phía trên để gán chi/nhánh cho trưởng chi.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Chi/nhánh</TableHead>
                    <TableHead className="w-24 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopes.map((scope) => {
                    const scopeUser = usersById.get(scope.userId);
                    const scopeBranch = branchesById.get(scope.branchId);
                    return (
                      <TableRow key={scope.id}>
                        <TableCell>
                          {scopeUser
                            ? `${scopeUser.name} (${scopeUser.employeeCode})`
                            : scope.userId}
                        </TableCell>
                        <TableCell>
                          {scopedRoleLabels[scope.roleCode] ?? scope.roleCode}
                        </TableCell>
                        <TableCell>{scopeBranch?.name ?? scope.branchId}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleRemove(scope.id)}
                            aria-label="Gỡ phạm vi"
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không tải được dữ liệu phân quyền theo chi.";
}
