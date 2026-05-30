"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PageHeader } from "@/components/pages/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  createDeathAnniversary,
  DeathAnniversaryRecord,
  deleteDeathAnniversary,
  getDeathAnniversaries,
  NotificationScope,
  notificationScopeLabels,
  updateDeathAnniversary,
} from "@/lib/calendar";
import { BranchRecord, getBranches, getPersons, PersonRecord } from "@/lib/genealogy";

interface AnniversaryFormState {
  id?: string;
  personId: string;
  lunarDay: string;
  lunarMonth: string;
  isLeapMonth: boolean;
  notifyBeforeDays: string;
  notificationScope: NotificationScope;
  branchScopeId: string;
  ceremonyNote: string;
  active: boolean;
}

const emptyForm: AnniversaryFormState = {
  personId: "",
  lunarDay: "",
  lunarMonth: "",
  isLeapMonth: false,
  notifyBeforeDays: "7",
  notificationScope: "BRANCH",
  branchScopeId: "",
  ceremonyNote: "",
  active: true,
};

export function DeathAnniversariesPage() {
  return (
    <ProtectedPage permissions={[PERMISSIONS.DEATH_ANNIVERSARIES_MANAGE]}>
      <DeathAnniversariesContent />
    </ProtectedPage>
  );
}

function DeathAnniversariesContent() {
  const [anniversaries, setAnniversaries] = useState<DeathAnniversaryRecord[]>([]);
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [form, setForm] = useState<AnniversaryFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, personList, branchList] = await Promise.all([
        getDeathAnniversaries(),
        getPersons(),
        getBranches().catch(() => []),
      ]);
      setAnniversaries(list);
      setPersons(personList);
      setBranches(branchList);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Không tải được ngày giỗ.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDeathAnniversaries(),
      getPersons(),
      getBranches().catch(() => [] as BranchRecord[]),
    ])
      .then(([list, personList, branchList]) => {
        if (!active) return;
        setAnniversaries(list);
        setPersons(personList);
        setBranches(branchList);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError ? caught.message : "Không tải được ngày giỗ.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const personName = useMemo(() => {
    const map = new Map(persons.map((person) => [person.id, person.fullName]));
    return (id: string) => map.get(id) ?? "(không rõ)";
  }, [persons]);

  const branchName = useMemo(() => {
    const map = new Map(branches.map((branch) => [branch.id, branch.name]));
    return (id?: string) => (id ? (map.get(id) ?? "—") : "Toàn họ");
  }, [branches]);

  const deceasedPersons = useMemo(
    () => persons.filter((person) => person.lifeStatus === "DECEASED"),
    [persons],
  );

  const resetForm = () => setForm(emptyForm);

  const startEdit = (record: DeathAnniversaryRecord) => {
    setForm({
      id: record.id,
      personId: record.personId,
      lunarDay: String(record.lunarDay),
      lunarMonth: String(record.lunarMonth),
      isLeapMonth: record.isLeapMonth,
      notifyBeforeDays: String(record.notifyBeforeDays),
      notificationScope: record.notificationScope,
      branchScopeId: record.branchScopeId ?? "",
      ceremonyNote: record.ceremonyNote ?? "",
      active: record.active,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const lunarDay = Number(form.lunarDay);
    const lunarMonth = Number(form.lunarMonth);
    if (!form.personId || !lunarDay || !lunarMonth) {
      toast.error("Cần chọn người đã khuất và nhập ngày/tháng âm.");
      return;
    }
    if (form.notificationScope === "CUSTOM" && !form.branchScopeId) {
      toast.error("Phạm vi tùy chỉnh cần chọn chi/nhánh.");
      return;
    }
    setIsSaving(true);
    try {
      const basePayload = {
        lunarDay,
        lunarMonth,
        isLeapMonth: form.isLeapMonth,
        notifyBeforeDays: Number(form.notifyBeforeDays) || 0,
        notificationScope: form.notificationScope,
        branchScopeId:
          form.notificationScope === "CLAN"
            ? undefined
            : form.branchScopeId || undefined,
        ceremonyNote: form.ceremonyNote.trim() || undefined,
        active: form.active,
      };
      if (form.id) {
        await updateDeathAnniversary(form.id, basePayload);
        toast.success("Đã cập nhật ngày giỗ.");
      } else {
        await createDeathAnniversary({ personId: form.personId, ...basePayload });
        toast.success("Đã tạo ngày giỗ.");
      }
      resetForm();
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không lưu được ngày giỗ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (record: DeathAnniversaryRecord) => {
    try {
      await updateDeathAnniversary(record.id, { active: !record.active });
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không cập nhật được.");
    }
  };

  const handleDelete = async (record: DeathAnniversaryRecord) => {
    try {
      await deleteDeathAnniversary(record.id);
      toast.success("Đã xóa ngày giỗ.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Không xóa được.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Ngày giỗ âm lịch"
          description="Lưu ngày giỗ theo âm lịch, tháng nhuận và phạm vi chi/nhánh nhận nhắc."
        />
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Tải lại">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {form.id ? "Sửa ngày giỗ" : "Thêm ngày giỗ"}
          </CardTitle>
          <CardDescription>
            Ngày âm gốc được lưu nguyên vẹn; hệ thống quy đổi ngày dương theo từng năm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-1 md:col-span-2">
              <Label>Người đã khuất</Label>
              <Select
                value={form.personId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, personId: value ?? "" }))
                }
                disabled={Boolean(form.id)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn người đã khuất" />
                </SelectTrigger>
                <SelectContent>
                  {deceasedPersons.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Chưa có thành viên đã khuất
                    </SelectItem>
                  ) : (
                    deceasedPersons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lunar-day">Ngày âm</Label>
              <Input
                id="lunar-day"
                type="number"
                min={1}
                max={30}
                value={form.lunarDay}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lunarDay: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lunar-month">Tháng âm</Label>
              <Input
                id="lunar-month"
                type="number"
                min={1}
                max={12}
                value={form.lunarMonth}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lunarMonth: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="leap"
                checked={form.isLeapMonth}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isLeapMonth: checked }))
                }
              />
              <Label htmlFor="leap">Tháng nhuận</Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notify-before">Nhắc trước (ngày)</Label>
              <Input
                id="notify-before"
                type="number"
                min={0}
                max={60}
                value={form.notifyBeforeDays}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notifyBeforeDays: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Phạm vi nhắc</Label>
              <Select
                value={form.notificationScope}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    notificationScope: value as NotificationScope,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH">Theo chi/nhánh</SelectItem>
                  <SelectItem value="CLAN">Toàn họ</SelectItem>
                  <SelectItem value="CUSTOM">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.notificationScope !== "CLAN" ? (
              <div className="space-y-1">
                <Label>Chi/nhánh nhận nhắc</Label>
                <Select
                  value={form.branchScopeId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, branchScopeId: value ?? "" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Mặc định theo chi của người mất" />
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
            ) : null}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="ceremony-note">Ghi chú lễ giỗ</Label>
              <Textarea
                id="ceremony-note"
                value={form.ceremonyNote}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ceremonyNote: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, active: checked }))
                }
              />
              <Label htmlFor="active">Đang hiệu lực</Label>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Button type="submit" disabled={isSaving}>
                {form.id ? "Cập nhật" : "Thêm ngày giỗ"}
              </Button>
              {form.id ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="size-4" /> Hủy sửa
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách ngày giỗ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : anniversaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có ngày giỗ nào.</p>
          ) : (
            <ul className="divide-y">
              {anniversaries.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{personName(record.personId)}</span>
                      <Badge variant="secondary" className="text-[11px]">
                        {record.lunarDay}/{record.lunarMonth} âm
                        {record.isLeapMonth ? " (nhuận)" : ""}
                      </Badge>
                      {!record.active ? (
                        <Badge variant="outline" className="text-[11px]">
                          Tắt
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notificationScopeLabels[record.notificationScope]} ·{" "}
                      {branchName(record.branchScopeId)} · nhắc trước{" "}
                      {record.notifyBeforeDays} ngày
                      {record.solarDateCache
                        ? ` · dương ~ ${record.solarDateCache}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(record)}
                    >
                      {record.active ? "Vô hiệu" : "Bật"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(record)}
                      aria-label="Sửa"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(record)}
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
  );
}
