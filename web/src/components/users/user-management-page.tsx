"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserRoundX,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
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
import { formatDateTime as formatDateTimeInVietnam } from "@/lib/date-time";
import {
  createUser,
  deleteUser,
  getUserRoles,
  getUsers,
  ManagedUser,
  resetUserPassword,
  setUserStatus,
  updateUser,
  UserRole,
} from "@/lib/users";

type StatusFilter = "all" | "active" | "inactive";

interface UserFormState {
  employeeCode: string;
  name: string;
  password: string;
  roleCode: string;
}

const defaultForm: UserFormState = {
  employeeCode: "",
  name: "",
  password: "",
  roleCode: "NGUOI_BINH_THUONG",
};

const statusLabels: Record<StatusFilter, string> = {
  all: "Tất cả trạng thái",
  active: "Đang hoạt động",
  inactive: "Đã khóa",
};

const permissionLabels: Record<string, string> = {
  "dashboard.view": "Tổng quan",
  "users.view": "Xem người dùng",
  "users.manage": "Người dùng",
  "users.change-own-password": "Đổi mật khẩu cá nhân",
  "audit-logs.view": "Nhật ký",
  "clan.manage": "Dòng họ",
  "branches.manage": "Chi/nhánh",
  "persons.manage": "Thành viên",
  "relationships.manage": "Quan hệ",
};

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const canManage = Boolean(
    currentUser?.permissions.includes(PERMISSIONS.USERS_MANAGE),
  );
  const canChangeOwnPassword = Boolean(
    currentUser?.permissions.includes(PERMISSIONS.USERS_CHANGE_OWN_PASSWORD),
  );
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState<UserFormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ManagedUser | null>(null);
  const [nextActiveStatus, setNextActiveStatus] = useState<boolean | null>(
    null,
  );
  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchUserManagementData()
      .then(({ users: nextUsers, roles: nextRoles }) => {
        if (!mounted) {
          return;
        }

        setUsers(nextUsers);
        setRoles(nextRoles);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!mounted) {
          return;
        }

        setUsers([]);
        setRoles([]);
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

  const filteredUsers = useMemo(
    () => filterUsers(users, search, statusFilter),
    [search, statusFilter, users],
  );
  const activeCount = users.filter((item) => item.isActive).length;
  const inactiveCount = users.length - activeCount;

  const refresh = async () => {
    setIsLoading(true);

    try {
      const nextData = await fetchUserManagementData();
      setUsers(nextData.users);
      setRoles(nextData.roles);
      setError(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setEditingUser(null);
    setFormData(defaultForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const startEdit = (managedUser: ManagedUser) => {
    setEditingUser(managedUser);
    setFormData({
      employeeCode: managedUser.employeeCode,
      name: managedUser.name,
      password: "",
      roleCode: managedUser.roles[0]?.code ?? "NGUOI_BINH_THUONG",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingUser(null);
    setFormData(defaultForm);
    setFormError(null);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.employeeCode, {
          name: formData.name.trim(),
          roleCode: formData.roleCode,
        });
        toast.success("Đã cập nhật tài khoản.");
      } else {
        await createUser({
          employeeCode: formData.employeeCode.trim().toUpperCase(),
          name: formData.name.trim(),
          password: formData.password,
          roleCode: formData.roleCode,
        });
        toast.success("Đã tạo tài khoản.");
      }

      closeForm();
      await refresh();
    } catch (caughtError) {
      setFormError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  };

  const submitStatusChange = async () => {
    if (!statusTarget || nextActiveStatus === null) {
      return;
    }

    setIsSaving(true);

    try {
      await setUserStatus(statusTarget.employeeCode, nextActiveStatus);
      toast.success(
        nextActiveStatus ? "Đã kích hoạt tài khoản." : "Đã khóa tài khoản.",
      );
      setStatusTarget(null);
      setNextActiveStatus(null);
      await refresh();
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUser(deleteTarget.employeeCode);
      toast.success("Đã xoá tài khoản.");
      setDeleteTarget(null);
      await refresh();
    } catch (caughtError) {
      setDeleteError(getErrorMessage(caughtError));
    } finally {
      setIsDeleting(false);
    }
  };

  const submitPasswordReset = async () => {
    if (!passwordTarget) {
      return;
    }

    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      await resetUserPassword(passwordTarget.employeeCode, newPassword);
      toast.success("Đã đặt lại mật khẩu.");
      setPasswordTarget(null);
      setNewPassword("");
      setConfirmPassword("");
      await refresh();
    } catch (caughtError) {
      setPasswordError(getErrorMessage(caughtError));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <ProtectedPage permissions={[PERMISSIONS.USERS_VIEW]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Người dùng"
            description="Quản trị tài khoản, vai trò và quyền truy cập nền tảng."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              <RefreshCw data-icon="inline-start" />
              Tải lại
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canManage}
              onClick={startCreate}
            >
              <Plus data-icon="inline-start" />
              Thêm tài khoản
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Lỗi dữ liệu người dùng</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Tổng tài khoản"
            value={users.length}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Đang hoạt động"
            value={activeCount}
          />
          <MetricCard icon={UserRoundX} label="Đã khóa" value={inactiveCount} />
          <MetricCard icon={ShieldCheck} label="Vai trò" value={roles.length} />
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Danh sách tài khoản</CardTitle>
              <CardDescription>
                Mã tài khoản dùng để đăng nhập; mật khẩu không hiển thị lại sau
                khi lưu.
              </CardDescription>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo mã, tên, vai trò hoặc quyền"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter((value as StatusFilter) || "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trạng thái">
                    {statusLabels[statusFilter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && users.length === 0 ? (
              <LoadingState />
            ) : filteredUsers.length === 0 ? (
              <Alert>
                <Users className="size-4" />
                <AlertTitle>Chưa có tài khoản phù hợp</AlertTitle>
                <AlertDescription>
                  Đổi bộ lọc hoặc thêm tài khoản cho vai trò cần kiểm thử.
                </AlertDescription>
              </Alert>
            ) : (
              <UsersTable
                canChangeOwnPassword={canChangeOwnPassword}
                canManage={canManage}
                currentUserId={currentUser?.id}
                users={filteredUsers}
                onDelete={(managedUser) => {
                  setDeleteTarget(managedUser);
                  setDeleteError(null);
                }}
                onEdit={startEdit}
                onResetPassword={(managedUser) => {
                  setPasswordTarget(managedUser);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                }}
                onStatusChange={(managedUser, nextStatus) => {
                  setStatusTarget(managedUser);
                  setNextActiveStatus(nextStatus);
                }}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.code}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <CardDescription>{role.code}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {role.permissions.length} quyền
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permissionLabels[permission] ?? permission}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <UserFormDialog
          editingUser={editingUser}
          error={formError}
          formData={formData}
          isOpen={isFormOpen}
          isSaving={isSaving}
          roles={roles}
          selfEditing={editingUser?.id === currentUser?.id}
          onCancel={closeForm}
          onChange={(name, value) =>
            setFormData((current) => ({ ...current, [name]: value }))
          }
          onOpenChange={(open) => {
            if (!open) {
              closeForm();
            }
          }}
          onSubmit={submitForm}
        />

        <StatusDialog
          isOpen={Boolean(statusTarget)}
          isSaving={isSaving}
          nextActiveStatus={nextActiveStatus}
          target={statusTarget}
          onCancel={() => {
            if (!isSaving) {
              setStatusTarget(null);
              setNextActiveStatus(null);
            }
          }}
          onConfirm={() => void submitStatusChange()}
        />

        <PasswordDialog
          confirmPassword={confirmPassword}
          error={passwordError}
          isOpen={Boolean(passwordTarget)}
          isSaving={isPasswordSaving}
          newPassword={newPassword}
          target={passwordTarget}
          onCancel={() => {
            if (!isPasswordSaving) {
              setPasswordTarget(null);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError(null);
            }
          }}
          onChangeConfirm={setConfirmPassword}
          onChangePassword={setNewPassword}
          onConfirm={() => void submitPasswordReset()}
        />

        <DeleteUserDialog
          error={deleteError}
          isDeleting={isDeleting}
          target={deleteTarget}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void submitDelete()}
        />
      </div>
    </ProtectedPage>
  );
}

function DeleteUserDialog({
  error,
  isDeleting,
  target,
  onCancel,
  onConfirm,
}: {
  error: string | null;
  isDeleting: boolean;
  target: ManagedUser | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoá tài khoản</DialogTitle>
          <DialogDescription>
            Thao tác này không thể hoàn tác. Tài khoản đã tạo dữ liệu vận hành sẽ
            không xoá được.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Không xoá được</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <TriangleAlert className="size-4" />
            <AlertTitle>{target?.employeeCode ?? "Tài khoản"}</AlertTitle>
            <AlertDescription>
              {target?.name ?? ""} - thao tác này sẽ được ghi vào nhật ký.
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            Xoá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
    </div>
  );
}

function UsersTable({
  canChangeOwnPassword,
  canManage,
  currentUserId,
  users,
  onDelete,
  onEdit,
  onResetPassword,
  onStatusChange,
}: {
  canChangeOwnPassword: boolean;
  canManage: boolean;
  currentUserId?: string;
  users: ManagedUser[];
  onDelete: (managedUser: ManagedUser) => void;
  onEdit: (managedUser: ManagedUser) => void;
  onResetPassword: (managedUser: ManagedUser) => void;
  onStatusChange: (managedUser: ManagedUser, nextStatus: boolean) => void;
}) {
  const columns: AdvancedDataTableColumn<ManagedUser>[] = [
    {
      id: "employeeCode",
      header: "Mã tài khoản",
      accessor: "employeeCode",
      cell: (managedUser) => (
        <span className="font-medium">{managedUser.employeeCode}</span>
      ),
      width: 150,
    },
    {
      id: "name",
      header: "Họ tên",
      accessor: "name",
      width: 180,
    },
    {
      id: "roles",
      header: "Vai trò",
      accessor: (managedUser) => formatRoles(managedUser.roles),
      cell: (managedUser) => formatRoles(managedUser.roles),
      width: 160,
    },
    {
      id: "permissions",
      header: "Quyền",
      accessor: (managedUser) =>
        managedUser.permissions
          .map((permission) => permissionLabels[permission] ?? permission)
          .join(" "),
      cell: (managedUser) => (
        <div className="flex max-w-[360px] flex-wrap gap-1 whitespace-normal">
          {managedUser.permissions.slice(0, 4).map((permission) => (
            <Badge key={permission} variant="outline">
              {permissionLabels[permission] ?? permission}
            </Badge>
          ))}
          {managedUser.permissions.length > 4 ? (
            <Badge variant="secondary">
              +{managedUser.permissions.length - 4}
            </Badge>
          ) : null}
        </div>
      ),
      width: 360,
    },
    {
      id: "isActive",
      header: "Trạng thái",
      accessor: (managedUser) => (managedUser.isActive ? 1 : 0),
      cell: (managedUser) => <StatusBadge isActive={managedUser.isActive} />,
      width: 140,
    },
    {
      id: "updatedAt",
      header: "Cập nhật",
      accessor: "updatedAt",
      cell: (managedUser) => formatDateTime(managedUser.updatedAt),
      width: 180,
    },
    {
      id: "actions",
      header: "Thao tác",
      sortable: false,
      filterable: false,
      enableHiding: false,
      align: "right",
      width: 240,
      cell: (managedUser) => {
        const isSelf = managedUser.id === currentUserId;

        return (
          <div className="flex justify-end gap-2">
            {canManage ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Sửa tài khoản"
                onClick={() => onEdit(managedUser)}
              >
                <Pencil />
              </Button>
            ) : null}
            {canManage || (canChangeOwnPassword && isSelf) ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Đặt lại mật khẩu"
                onClick={() => onResetPassword(managedUser)}
              >
                <KeyRound />
              </Button>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                size="sm"
                variant={managedUser.isActive ? "outline" : "secondary"}
                disabled={isSelf && managedUser.isActive}
                onClick={() =>
                  onStatusChange(managedUser, !managedUser.isActive)
                }
              >
                {managedUser.isActive ? "Khóa" : "Kích hoạt"}
              </Button>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Xoá tài khoản"
                className="text-destructive hover:text-destructive"
                disabled={isSelf}
                onClick={() => onDelete(managedUser)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AdvancedDataTable
      columns={columns}
      data={users}
      emptyMessage="Chưa có tài khoản phù hợp."
      getRowId={(managedUser) => managedUser.id}
      stateStorageKey="users:management"
      stickyHeader
      virtualized
      paginationMode="pagination"
      pageSizeOptions={[25, 50, 100]}
      maxHeight={620}
    />
  );
}

function UserFormDialog({
  editingUser,
  error,
  formData,
  isOpen,
  isSaving,
  roles,
  selfEditing,
  onCancel,
  onChange,
  onOpenChange,
  onSubmit,
}: {
  editingUser: ManagedUser | null;
  error: string | null;
  formData: UserFormState;
  isOpen: boolean;
  isSaving: boolean;
  roles: UserRole[];
  selfEditing: boolean;
  onCancel: () => void;
  onChange: (name: keyof UserFormState, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const editing = Boolean(editingUser);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa tài khoản" : "Thêm tài khoản"}
          </DialogTitle>
          <DialogDescription>
            Tài khoản dùng mã đăng nhập và mật khẩu để truy cập hệ thống.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Không lưu được tài khoản</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {selfEditing ? (
          <Alert>
            <TriangleAlert className="size-4" />
            <AlertTitle>Đang sửa tài khoản hiện tại</AlertTitle>
            <AlertDescription>
              Hệ thống không cho tự đổi vai trò hoặc khóa chính tài khoản đang
              đăng nhập.
            </AlertDescription>
          </Alert>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeCode">Mã tài khoản</Label>
              <Input
                id="employeeCode"
                value={formData.employeeCode}
                onChange={(event) =>
                  onChange("employeeCode", event.target.value.toUpperCase())
                }
                required
                disabled={editing || isSaving}
                placeholder="VD: KT002"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => onChange("name", event.target.value)}
                required
                disabled={isSaving}
                placeholder="Tên người dùng"
              />
            </div>
          </div>
          {!editing ? (
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu ban đầu</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(event) => onChange("password", event.target.value)}
                required
                minLength={6}
                disabled={isSaving}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="roleCode">Vai trò</Label>
            <Select
              value={formData.roleCode}
              onValueChange={(value) => value && onChange("roleCode", value)}
              disabled={isSaving || selfEditing}
            >
              <SelectTrigger id="roleCode" className="w-full">
                <SelectValue placeholder="Chọn vai trò">
                  {roles.find((role) => role.code === formData.roleCode)
                    ?.name ?? formData.roleCode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.code} value={role.code}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({
  isOpen,
  isSaving,
  nextActiveStatus,
  target,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isSaving: boolean;
  nextActiveStatus: boolean | null;
  target: ManagedUser | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {nextActiveStatus ? "Kích hoạt tài khoản" : "Khóa tài khoản"}
          </DialogTitle>
          <DialogDescription>
            {nextActiveStatus
              ? "Tài khoản sẽ đăng nhập lại được sau khi kích hoạt."
              : "Tài khoản bị khóa sẽ không thể đăng nhập hoặc gọi API."}
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>{target?.employeeCode ?? "Tài khoản"}</AlertTitle>
          <AlertDescription>
            {target?.name ?? ""} - thao tác này sẽ được ghi vào nhật ký.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button type="button" disabled={isSaving} onClick={onConfirm}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  confirmPassword,
  error,
  isOpen,
  isSaving,
  newPassword,
  target,
  onCancel,
  onChangeConfirm,
  onChangePassword,
  onConfirm,
}: {
  confirmPassword: string;
  error: string | null;
  isOpen: boolean;
  isSaving: boolean;
  newPassword: string;
  target: ManagedUser | null;
  onCancel: () => void;
  onChangeConfirm: (value: string) => void;
  onChangePassword: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            Mật khẩu mới áp dụng cho {target?.employeeCode ?? "tài khoản"}.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Lỗi mật khẩu</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) => onChangePassword(event.target.value)}
            disabled={isSaving}
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => onChangeConfirm(event.target.value)}
            disabled={isSaving}
            minLength={6}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSaving || !newPassword || !confirmPassword}
            onClick={onConfirm}
          >
            Đặt lại mật khẩu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="gap-1" variant="secondary">
      <CheckCircle2 className="size-3" />
      Hoạt động
    </Badge>
  ) : (
    <Badge className="gap-1" variant="outline">
      <XCircle className="size-3" />
      Đã khóa
    </Badge>
  );
}

function filterUsers(
  users: ManagedUser[],
  search: string,
  statusFilter: StatusFilter,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return users.filter((managedUser) => {
    if (statusFilter === "active" && !managedUser.isActive) {
      return false;
    }

    if (statusFilter === "inactive" && managedUser.isActive) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      managedUser.employeeCode,
      managedUser.name,
      managedUser.defaultPath,
      ...managedUser.roles.map((role) => role.name),
      ...managedUser.permissions,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function formatRoles(roles: UserRole[]) {
  if (roles.length === 0) {
    return <span className="text-muted-foreground">Chưa gán</span>;
  }

  return roles.map((role) => role.name).join(", ");
}

function formatDateTime(value: string) {
  return formatDateTimeInVietnam(value, { timeStyle: "medium" });
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không xử lý được dữ liệu người dùng.";
}

async function fetchUserManagementData() {
  const [users, roles] = await Promise.all([getUsers(), getUserRoles()]);

  return { users, roles };
}
