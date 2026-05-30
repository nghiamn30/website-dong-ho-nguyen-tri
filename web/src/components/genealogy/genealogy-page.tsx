"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Heart,
  Network,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { PERMISSIONS } from "@/config/navigation";
import { ApiError } from "@/lib/auth";
import {
  archiveBranch,
  BranchPayload,
  BranchRecord,
  BranchTreeNode,
  ClanPayload,
  ClanRecord,
  createBranch,
  createMarriage,
  createParentChild,
  createPerson,
  deleteMarriage,
  deleteParentChild,
  deletePerson,
  FamilyTreeNode,
  FamilyTreeRecord,
  Gender,
  getBranches,
  getBranchTree,
  getClan,
  getFamilyTree,
  getMarriages,
  getParentChild,
  getPersonRelations,
  getPersons,
  LifeStatus,
  MarriagePayload,
  MarriageRecord,
  MarriageStatus,
  ParentChildPayload,
  ParentChildRelationRecord,
  ParentRelationType,
  ParentRole,
  PersonPayload,
  PersonRecord,
  PersonRelationsRecord,
  saveClan,
  transferLeadership,
  updateBranch,
  updatePerson,
} from "@/lib/genealogy";

export type GenealogyView =
  | "overview"
  | "clan"
  | "branches"
  | "persons"
  | "relationships"
  | "tree"
  | "people"
  | "person-detail";

interface GenealogyPageProps {
  view: GenealogyView;
  personId?: string;
  branchId?: string;
}

const genderLabels: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
};

const lifeStatusLabels: Record<LifeStatus, string> = {
  LIVING: "Còn sống",
  DECEASED: "Đã mất",
};

const marriageStatusLabels: Record<MarriageStatus, string> = {
  ACTIVE: "Đang kết hôn",
  DIVORCED: "Đã ly hôn",
  WIDOWED: "Góa",
  ENDED: "Đã kết thúc",
  UNKNOWN: "Chưa rõ",
};

interface PersonFormState {
  fullName: string;
  commonName: string;
  gender: "UNSET" | Gender;
  isClanMember: boolean;
  branchId?: string;
  generationNumber: string;
  displayOrder: string;
  birthSolarDate: string;
  birthLunarYear: string;
  birthLunarMonth: string;
  birthLunarDay: string;
  birthLunarIsLeapMonth: boolean;
  lifeStatus: LifeStatus;
  deathSolarDate: string;
  deathLunarYear: string;
  deathLunarMonth: string;
  deathLunarDay: string;
  burialPlace: string;
  deathNote: string;
  hometown: string;
  currentLocation: string;
  biography: string;
}

const emptyClan: ClanPayload = {
  name: "Dòng họ Nguyễn Trí",
  description: "",
  history: "",
  founderPersonId: undefined,
  ancestralHouseName: "",
  ancestralHouseAddress: "",
  contactInformation: "",
};

const emptyBranch: BranchPayload = {
  name: "",
  type: "Chi",
  parentBranchId: undefined,
  description: "",
  displayOrder: 0,
};

const emptyPersonForm: PersonFormState = {
  fullName: "",
  commonName: "",
  gender: "UNSET",
  isClanMember: true,
  branchId: undefined,
  generationNumber: "",
  displayOrder: "0",
  birthSolarDate: "",
  birthLunarYear: "",
  birthLunarMonth: "",
  birthLunarDay: "",
  birthLunarIsLeapMonth: false,
  lifeStatus: "LIVING",
  deathSolarDate: "",
  deathLunarYear: "",
  deathLunarMonth: "",
  deathLunarDay: "",
  burialPlace: "",
  deathNote: "",
  hometown: "",
  currentLocation: "",
  biography: "",
};

export function GenealogyPage({ view, personId, branchId }: GenealogyPageProps) {
  const { user, status } = useAuth();
  const [clan, setClan] = useState<ClanRecord | null>(null);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [branchTree, setBranchTree] = useState<BranchTreeNode[]>([]);
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [parentChild, setParentChild] = useState<ParentChildRelationRecord[]>([]);
  const [marriages, setMarriages] = useState<MarriageRecord[]>([]);
  const [familyTree, setFamilyTree] = useState<FamilyTreeRecord | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null);
  const [personRelations, setPersonRelations] =
    useState<PersonRelationsRecord | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canManageClan = Boolean(user?.permissions.includes(PERMISSIONS.CLAN_MANAGE));
  const canManageBranches = Boolean(
    user?.permissions.includes(PERMISSIONS.BRANCHES_MANAGE),
  );
  const canManagePersons = Boolean(
    user?.permissions.includes(PERMISSIONS.PERSONS_MANAGE),
  );
  const canManageRelationships = Boolean(
    user?.permissions.includes(PERMISSIONS.RELATIONSHIPS_MANAGE),
  );

  const refresh = async () => {
    setIsLoading(true);
    try {
      const [
        nextClan,
        nextBranches,
        nextBranchTree,
        nextPersons,
        nextParentChild,
        nextMarriages,
      ] = await Promise.all([
        getClan(),
        getBranches(),
        getBranchTree(),
        getPersons(search || undefined, branchId),
        getParentChild(),
        getMarriages(),
      ]);
      const nextTree = await getFamilyTree({ branchId, personId });
      const nextSelectedPerson = personId
        ? nextPersons.find((person) => person.id === personId) ?? null
        : null;
      const nextRelations =
        view === "person-detail" && personId
          ? await getPersonRelations(personId).catch(() => null)
          : null;

      setClan(nextClan);
      setBranches(nextBranches);
      setBranchTree(nextBranchTree);
      setPersons(nextPersons);
      setParentChild(nextParentChild);
      setMarriages(nextMarriages);
      setFamilyTree(nextTree);
      setSelectedPerson(nextSelectedPerson);
      setPersonRelations(nextRelations);
      setError(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      const timeoutId = window.setTimeout(() => void refresh(), 0);
      return () => window.clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, branchId, personId, view]);

  const metrics = useMemo(
    () => ({
      activeBranches: branches.filter((branch) => branch.status === "ACTIVE").length,
      persons: persons.length,
      branchHeads: branches.filter((branch) => Boolean(branch.headPersonId)).length,
      relationships: parentChild.length + marriages.length,
    }),
    [branches, persons, parentChild, marriages],
  );

  if (status === "loading" || isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title={getTitle(view)}
          description="Giai đoạn 1: dữ liệu lõi, chi/nhánh, thành viên, quan hệ và phả đồ."
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw data-icon="inline-start" />
          Tải lại
        </Button>
      </div>

      {view === "tree" ? (
        <Alert>
          <Network className="size-4" />
          <AlertTitle>Quyết định phả đồ G01-M01</AlertTitle>
          <AlertDescription>
            Chưa thêm React Flow ở giai đoạn này. Phả đồ dùng render phân cấp bằng
            React/CSS để giữ dependency gọn; React Flow sẽ được xem lại khi cây lớn,
            cần kéo thả node hoặc export nâng cao.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi dữ liệu gia phả</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {view === "overview" ? <Overview metrics={metrics} clan={clan} /> : null}
      {view === "clan" ? (
        <ClanSection
          key={clan?.id ?? "new-clan"}
          canManage={canManageClan}
          clan={clan}
          persons={persons}
          onSaved={refresh}
        />
      ) : null}
      {view === "branches" ? (
        <BranchSection
          canManage={canManageBranches}
          branches={branches}
          branchTree={branchTree}
          persons={persons}
          onChanged={refresh}
        />
      ) : null}
      {view === "persons" ? (
        <PersonSection
          branches={branches}
          canManage={canManagePersons}
          persons={persons}
          search={search}
          onChanged={refresh}
          onSearchChange={setSearch}
        />
      ) : null}
      {view === "relationships" ? (
        <RelationshipSection
          canManage={canManageRelationships}
          persons={persons}
          parentChild={parentChild}
          marriages={marriages}
          onChanged={refresh}
        />
      ) : null}
      {view === "tree" ? (
        <FamilyTreeSection
          branches={branches}
          branchId={branchId}
          familyTree={familyTree}
          persons={persons}
        />
      ) : null}
      {view === "people" ? (
        <PeopleSection
          branches={branches}
          persons={persons}
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
        />
      ) : null}
      {view === "person-detail" ? (
        <PersonDetail
          branches={branches}
          person={selectedPerson}
          relations={personRelations}
        />
      ) : null}
    </div>
  );
}

function Overview({
  metrics,
  clan,
}: {
  metrics: {
    activeBranches: number;
    persons: number;
    branchHeads: number;
    relationships: number;
  };
  clan: ClanRecord | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard icon={GitBranch} label="Chi/nhánh" value={metrics.activeBranches} />
      <MetricCard icon={Users} label="Thành viên" value={metrics.persons} />
      <MetricCard icon={Network} label="Trưởng chi" value={metrics.branchHeads} />
      <MetricCard icon={Heart} label="Quan hệ" value={metrics.relationships} />
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>{clan?.name ?? "Chưa cấu hình dòng họ"}</CardTitle>
          <CardDescription>
            {clan?.founderPersonId
              ? clan?.description ?? "Đã cấu hình thủy tổ làm node gốc của phả đồ."
              : "Bắt đầu bằng cấu hình dòng họ, tạo thủy tổ rồi gán làm node gốc."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ size: "sm" })} href="/genealogy/clan">
            Cấu hình dòng họ
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/genealogy/persons"
          >
            Nhập thành viên
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/family-tree"
          >
            Xem phả đồ
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function ClanSection({
  canManage,
  clan,
  persons,
  onSaved,
}: {
  canManage: boolean;
  clan: ClanRecord | null;
  persons: PersonRecord[];
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<ClanPayload>(() =>
    clan ? { ...emptyClan, ...clan } : emptyClan,
  );
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await saveClan(normalizePayload<ClanPayload>(form));
      toast.success("Đã lưu thông tin dòng họ.");
      await onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình dòng họ</CardTitle>
        <CardDescription>
          Thủy tổ được dùng làm node gốc của phả đồ toàn họ. Tạo thủy tổ ở mục Thành
          viên trước, sau đó chọn tại đây.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Tên dòng họ"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              required
            />
            <SelectField
              label="Thủy tổ"
              value={form.founderPersonId ?? "none"}
              options={[
                { value: "none", label: "Chưa chọn" },
                ...persons.map((person) => ({
                  value: person.id,
                  label: person.fullName,
                })),
              ]}
              onChange={(value) =>
                setForm({
                  ...form,
                  founderPersonId: value === "none" ? undefined : value,
                })
              }
            />
            <TextField
              label="Tên từ đường"
              value={form.ancestralHouseName ?? ""}
              onChange={(value) => setForm({ ...form, ancestralHouseName: value })}
            />
            <TextField
              label="Liên hệ"
              value={form.contactInformation ?? ""}
              onChange={(value) => setForm({ ...form, contactInformation: value })}
            />
          </div>
          <TextareaField
            label="Mô tả"
            value={form.description ?? ""}
            onChange={(value) => setForm({ ...form, description: value })}
          />
          <TextareaField
            label="Lịch sử"
            value={form.history ?? ""}
            onChange={(value) => setForm({ ...form, history: value })}
          />
          <TextareaField
            label="Địa chỉ từ đường"
            value={form.ancestralHouseAddress ?? ""}
            onChange={(value) =>
              setForm({ ...form, ancestralHouseAddress: value })
            }
          />
          <Button type="submit" disabled={!canManage || isSaving} className="w-fit">
            <Save data-icon="inline-start" />
            Lưu cấu hình
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BranchSection({
  canManage,
  branches,
  branchTree,
  persons,
  onChanged,
}: {
  canManage: boolean;
  branches: BranchRecord[];
  branchTree: BranchTreeNode[];
  persons: PersonRecord[];
  onChanged: () => Promise<void>;
}) {
  const [form, setForm] = useState<BranchPayload>(emptyBranch);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = normalizePayload<BranchPayload>(form);
      if (editingId) {
        await updateBranch(editingId, payload);
        toast.success("Đã cập nhật chi/nhánh.");
      } else {
        await createBranch(payload);
        toast.success("Đã tạo chi/nhánh.");
      }
      setEditingId(null);
      setForm(emptyBranch);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Sửa chi/nhánh" : "Thêm chi/nhánh"}</CardTitle>
          <CardDescription>
            Trưởng chi được đặt ở cây bên phải sau khi thành viên đã thuộc chi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <TextField
              label="Tên chi/nhánh"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              required
            />
            <TextField
              label="Loại"
              value={form.type ?? "Chi"}
              onChange={(type) => setForm({ ...form, type })}
            />
            <SelectField
              label="Chi/nhánh cha"
              value={form.parentBranchId ?? "none"}
              options={[
                { value: "none", label: "Không có (cấp gốc)" },
                ...branches
                  .filter((branch) => branch.id !== editingId)
                  .map((branch) => ({ value: branch.id, label: branch.name })),
              ]}
              onChange={(value) =>
                setForm({
                  ...form,
                  parentBranchId: value === "none" ? undefined : value,
                })
              }
            />
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={String(form.displayOrder ?? 0)}
              onChange={(value) =>
                setForm({ ...form, displayOrder: Number(value) || 0 })
              }
            />
            <TextareaField
              label="Mô tả"
              value={form.description ?? ""}
              onChange={(description) => setForm({ ...form, description })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!canManage}>
                <Save data-icon="inline-start" />
                Lưu
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyBranch);
                  }}
                >
                  Hủy
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cây chi/nhánh</CardTitle>
          <CardDescription>Hỗ trợ nhiều tầng chi, phái, ngành, nhánh.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branchTree.length === 0 ? (
            <EmptyState text="Chưa có chi/nhánh." />
          ) : (
            <div className="space-y-3">
              {branchTree.map((branch) => (
                <BranchNode
                  key={branch.id}
                  branch={branch}
                  persons={persons}
                  canManage={canManage}
                  onChanged={onChanged}
                  onEdit={(record) => {
                    setEditingId(record.id);
                    setForm({
                      name: record.name,
                      type: record.type,
                      parentBranchId: record.parentBranchId,
                      displayOrder: record.displayOrder,
                      description: record.description ?? "",
                    });
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PersonSection({
  branches,
  canManage,
  persons,
  search,
  onChanged,
  onSearchChange,
}: {
  branches: BranchRecord[];
  canManage: boolean;
  persons: PersonRecord[];
  search: string;
  onChanged: () => Promise<void>;
  onSearchChange: (value: string) => void;
}) {
  const [form, setForm] = useState<PersonFormState>(emptyPersonForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const deceased = form.lifeStatus === "DECEASED";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.gender === "UNSET") {
      toast.error("Bắt buộc chọn giới tính (Nam hoặc Nữ).");
      return;
    }
    try {
      const payload = buildPersonPayload(form);
      if (editingId) {
        await updatePerson(editingId, payload);
        toast.success("Đã cập nhật thành viên.");
      } else {
        await createPerson(payload);
        toast.success("Đã thêm thành viên.");
      }
      setEditingId(null);
      setForm(emptyPersonForm);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[460px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Sửa thành viên" : "Thêm thành viên"}</CardTitle>
          <CardDescription>
            Thông tin cá nhân được mọi người trong hệ thống xem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <TextField
              label="Họ tên"
              value={form.fullName}
              onChange={(fullName) => setForm({ ...form, fullName })}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Tên thường gọi"
                value={form.commonName}
                onChange={(commonName) => setForm({ ...form, commonName })}
              />
              <SelectField
                label="Giới tính *"
                value={form.gender}
                options={[
                  { value: "UNSET", label: "— Chọn giới tính —" },
                  { value: "MALE", label: "Nam" },
                  { value: "FEMALE", label: "Nữ" },
                ]}
                onChange={(value) =>
                  setForm({ ...form, gender: value as PersonFormState["gender"] })
                }
              />
              <SelectField
                label="Chi/nhánh"
                value={form.branchId ?? "none"}
                options={[
                  { value: "none", label: "Chưa gán" },
                  ...branches.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    branchId: value === "none" ? undefined : value,
                  })
                }
              />
              <SelectField
                label="Vai trò trong họ"
                value={form.isClanMember ? "member" : "spouse"}
                options={[
                  { value: "member", label: "Người trong dòng họ" },
                  { value: "spouse", label: "Dâu/rể/phối ngẫu" },
                ]}
                onChange={(value) =>
                  setForm({ ...form, isClanMember: value === "member" })
                }
              />
              <TextField
                label="Đời thứ"
                type="number"
                value={form.generationNumber}
                onChange={(value) => setForm({ ...form, generationNumber: value })}
              />
              <TextField
                label="Thứ tự hiển thị"
                type="number"
                value={form.displayOrder}
                onChange={(value) => setForm({ ...form, displayOrder: value })}
              />
            </div>

            <fieldset className="space-y-3 rounded-md border p-3">
              <legend className="px-1 text-sm font-medium">Ngày sinh</legend>
              <TextField
                label="Ngày sinh dương"
                type="date"
                value={form.birthSolarDate}
                onChange={(birthSolarDate) => setForm({ ...form, birthSolarDate })}
              />
              <LunarFields
                prefix="birth"
                year={form.birthLunarYear}
                month={form.birthLunarMonth}
                day={form.birthLunarDay}
                isLeap={form.birthLunarIsLeapMonth}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />
            </fieldset>

            <SelectField
              label="Trạng thái"
              value={form.lifeStatus}
              options={[
                { value: "LIVING", label: "Còn sống" },
                { value: "DECEASED", label: "Đã mất" },
              ]}
              onChange={(value) =>
                setForm({ ...form, lifeStatus: value as LifeStatus })
              }
            />

            {deceased ? (
              <fieldset className="space-y-3 rounded-md border p-3">
                <legend className="px-1 text-sm font-medium">Thông tin mất</legend>
                <TextField
                  label="Ngày mất dương"
                  type="date"
                  value={form.deathSolarDate}
                  onChange={(deathSolarDate) =>
                    setForm({ ...form, deathSolarDate })
                  }
                />
                <LunarFields
                  prefix="death"
                  year={form.deathLunarYear}
                  month={form.deathLunarMonth}
                  day={form.deathLunarDay}
                  onChange={(patch) => setForm({ ...form, ...patch })}
                />
                <TextField
                  label="Nơi an táng"
                  value={form.burialPlace}
                  onChange={(burialPlace) => setForm({ ...form, burialPlace })}
                />
                <TextareaField
                  label="Ghi chú ngày mất"
                  value={form.deathNote}
                  onChange={(deathNote) => setForm({ ...form, deathNote })}
                />
              </fieldset>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Quê quán"
                value={form.hometown}
                onChange={(hometown) => setForm({ ...form, hometown })}
              />
              <TextField
                label="Nơi sinh sống"
                value={form.currentLocation}
                onChange={(currentLocation) =>
                  setForm({ ...form, currentLocation })
                }
              />
            </div>
            <TextareaField
              label="Tiểu sử"
              value={form.biography}
              onChange={(biography) => setForm({ ...form, biography })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!canManage}>
                <Save data-icon="inline-start" />
                Lưu
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyPersonForm);
                  }}
                >
                  Hủy
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Danh sách thành viên</CardTitle>
            <CardDescription>Tìm theo tên, tên thường gọi hoặc quê quán.</CardDescription>
          </div>
          <SearchInput value={search} onChange={onSearchChange} />
        </CardHeader>
        <CardContent>
          <PersonList
            branches={branches}
            canManage={canManage}
            persons={persons}
            onDelete={async (id) => {
              try {
                await deletePerson(id);
                toast.success("Đã xoá thành viên.");
                await onChanged();
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            onEdit={(person) => {
              setEditingId(person.id);
              setForm(personToForm(person));
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RelationshipSection({
  canManage,
  persons,
  parentChild,
  marriages,
  onChanged,
}: {
  canManage: boolean;
  persons: PersonRecord[];
  parentChild: ParentChildRelationRecord[];
  marriages: MarriageRecord[];
  onChanged: () => Promise<void>;
}) {
  const [pcForm, setPcForm] = useState<ParentChildPayload>({
    parentPersonId: "",
    childPersonId: "",
    parentRole: "FATHER",
    relationType: "BIOLOGICAL",
  });
  const [marriageForm, setMarriageForm] = useState<MarriagePayload>({
    husbandPersonId: "",
    wifePersonId: "",
    status: "ACTIVE",
  });

  const males = persons.filter((person) => person.gender === "MALE");
  const females = persons.filter((person) => person.gender === "FEMALE");

  async function submitParentChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createParentChild(pcForm);
      toast.success("Đã gắn quan hệ cha/mẹ - con.");
      setPcForm({
        parentPersonId: "",
        childPersonId: "",
        parentRole: "FATHER",
        relationType: "BIOLOGICAL",
      });
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function submitMarriage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createMarriage(marriageForm);
      toast.success("Đã ghi nhận hôn nhân.");
      setMarriageForm({
        husbandPersonId: "",
        wifePersonId: "",
        status: "ACTIVE",
      });
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Quan hệ cha/mẹ - con</CardTitle>
          <CardDescription>Lưu một chiều: cha/mẹ → con.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={submitParentChild}>
            <SelectField
              label="Cha/mẹ"
              value={pcForm.parentPersonId || "none"}
              options={[
                { value: "none", label: "Chọn thành viên" },
                ...personOptions(persons),
              ]}
              onChange={(value) =>
                setPcForm({
                  ...pcForm,
                  parentPersonId: value === "none" ? "" : value,
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Vai trò"
                value={pcForm.parentRole}
                options={[
                  { value: "FATHER", label: "Cha" },
                  { value: "MOTHER", label: "Mẹ" },
                ]}
                onChange={(value) =>
                  setPcForm({ ...pcForm, parentRole: value as ParentRole })
                }
              />
              <SelectField
                label="Loại quan hệ"
                value={pcForm.relationType ?? "BIOLOGICAL"}
                options={[
                  { value: "BIOLOGICAL", label: "Ruột" },
                  { value: "ADOPTIVE", label: "Nuôi" },
                ]}
                onChange={(value) =>
                  setPcForm({
                    ...pcForm,
                    relationType: value as ParentRelationType,
                  })
                }
              />
            </div>
            <SelectField
              label="Con"
              value={pcForm.childPersonId || "none"}
              options={[
                { value: "none", label: "Chọn thành viên" },
                ...personOptions(persons),
              ]}
              onChange={(value) =>
                setPcForm({
                  ...pcForm,
                  childPersonId: value === "none" ? "" : value,
                })
              }
            />
            <Button
              type="submit"
              disabled={
                !canManage || !pcForm.parentPersonId || !pcForm.childPersonId
              }
            >
              <Save data-icon="inline-start" />
              Gắn quan hệ
            </Button>
          </form>
          <div className="space-y-2">
            {parentChild.length === 0 ? (
              <EmptyState text="Chưa có quan hệ cha/mẹ - con." />
            ) : (
              parentChild.map((relation) => (
                <RelationRow
                  key={relation.id}
                  canManage={canManage}
                  onDelete={async () => {
                    await deleteParentChild(relation.id);
                    toast.success("Đã xoá quan hệ.");
                    await onChanged();
                  }}
                >
                  <strong>{personName(persons, relation.parentPersonId)}</strong> là{" "}
                  {parentRoleLabel(relation.parentRole, relation.relationType)} của{" "}
                  <strong>{personName(persons, relation.childPersonId)}</strong>
                </RelationRow>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hôn nhân</CardTitle>
          <CardDescription>Chồng là nam, vợ là nữ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={submitMarriage}>
            <SelectField
              label="Chồng"
              value={marriageForm.husbandPersonId || "none"}
              options={[
                { value: "none", label: "Chọn nam giới" },
                ...personOptions(males),
              ]}
              onChange={(value) =>
                setMarriageForm({
                  ...marriageForm,
                  husbandPersonId: value === "none" ? "" : value,
                })
              }
            />
            <SelectField
              label="Vợ"
              value={marriageForm.wifePersonId || "none"}
              options={[
                { value: "none", label: "Chọn nữ giới" },
                ...personOptions(females),
              ]}
              onChange={(value) =>
                setMarriageForm({
                  ...marriageForm,
                  wifePersonId: value === "none" ? "" : value,
                })
              }
            />
            <SelectField
              label="Trạng thái"
              value={marriageForm.status ?? "ACTIVE"}
              options={Object.entries(marriageStatusLabels).map(
                ([value, label]) => ({ value, label }),
              )}
              onChange={(value) =>
                setMarriageForm({
                  ...marriageForm,
                  status: value as MarriageStatus,
                })
              }
            />
            <Button
              type="submit"
              disabled={
                !canManage ||
                !marriageForm.husbandPersonId ||
                !marriageForm.wifePersonId
              }
            >
              <Heart data-icon="inline-start" />
              Ghi nhận hôn nhân
            </Button>
          </form>
          <div className="space-y-2">
            {marriages.length === 0 ? (
              <EmptyState text="Chưa có hôn nhân." />
            ) : (
              marriages.map((marriage) => (
                <RelationRow
                  key={marriage.id}
                  canManage={canManage}
                  onDelete={async () => {
                    await deleteMarriage(marriage.id);
                    toast.success("Đã xoá hôn nhân.");
                    await onChanged();
                  }}
                >
                  <strong>{personName(persons, marriage.husbandPersonId)}</strong>
                  {" — "}
                  <strong>{personName(persons, marriage.wifePersonId)}</strong>{" "}
                  <Badge variant="outline">
                    {marriageStatusLabels[marriage.status]}
                  </Badge>
                </RelationRow>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FamilyTreeSection({
  branches,
  branchId,
  familyTree,
  persons,
}: {
  branches: BranchRecord[];
  branchId?: string;
  familyTree: FamilyTreeRecord | null;
  persons: PersonRecord[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phả đồ</CardTitle>
        <CardDescription>
          {branchId
            ? `Đang lọc theo ${branches.find((branch) => branch.id === branchId)?.name ?? "chi/nhánh"}`
            : "Phả đồ toàn họ bắt đầu từ thủy tổ nếu đã cấu hình."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {persons.length === 0 ? (
          <EmptyState text="Chưa có thành viên để dựng phả đồ." />
        ) : familyTree?.nodes.length ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-max gap-6">
              {familyTree.nodes.map((node) => (
                <TreeNode key={node.person.id} node={node} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text="Chưa xác định được node gốc của phả đồ. Hãy chọn thủy tổ ở cấu hình dòng họ." />
        )}
      </CardContent>
    </Card>
  );
}

function PeopleSection({
  branches,
  persons,
  search,
  onSearchChange,
  onRefresh,
}: {
  branches: BranchRecord[];
  persons: PersonRecord[];
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Tra cứu thành viên</CardTitle>
          <CardDescription>
            Thông tin cá nhân trong gia phả không phân quyền đọc.
          </CardDescription>
        </div>
        <SearchInput
          value={search}
          onChange={async (value) => {
            onSearchChange(value);
            await onRefresh();
          }}
        />
      </CardHeader>
      <CardContent>
        <PersonList branches={branches} canManage={false} persons={persons} />
      </CardContent>
    </Card>
  );
}

function PersonDetail({
  branches,
  person,
  relations,
}: {
  branches: BranchRecord[];
  person: PersonRecord | null;
  relations: PersonRelationsRecord | null;
}) {
  if (!person) {
    return <EmptyState text="Không tìm thấy thành viên." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{person.fullName}</CardTitle>
        <CardDescription>{person.commonName || "Hồ sơ thành viên"}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Info label="Chi/nhánh" value={branchName(branches, person.branchId)} />
        <Info label="Đời thứ" value={person.generationNumber?.toString()} />
        <Info label="Giới tính" value={genderLabels[person.gender]} />
        <Info label="Trạng thái" value={lifeStatusLabels[person.lifeStatus]} />
        <Info label="Vai trò" value={person.isClanMember ? "Người trong họ" : "Dâu/rể/phối ngẫu"} />
        <Info label="Ngày sinh dương" value={person.birthSolarDate} />
        <Info label="Ngày sinh âm" value={formatLunar(person)} />
        {person.lifeStatus === "DECEASED" ? (
          <>
            <Info label="Ngày mất dương" value={person.deathSolarDate} />
            <Info label="Nơi an táng" value={person.burialPlace} />
          </>
        ) : null}
        <Info label="Quê quán" value={person.hometown} />
        <Info label="Nơi sinh sống" value={person.currentLocation} />
        <div className="md:col-span-2">
          <Info label="Tiểu sử" value={person.biography} />
        </div>
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-sm font-medium">Quan hệ gia đình</h3>
          {relations ? (
            <div className="grid gap-3 md:grid-cols-3">
              <RelationGroup
                title="Cha/mẹ"
                entries={relations.parents.map(
                  (entry) =>
                    `${parentRoleLabel(entry.parentRole, entry.relationType)}: ${entry.person.fullName}`,
                )}
              />
              <RelationGroup
                title="Vợ/chồng"
                entries={relations.spouses.map(
                  (spouse) =>
                    `${spouse.person.fullName} (${marriageStatusLabels[spouse.status]})`,
                )}
              />
              <RelationGroup
                title="Con"
                entries={relations.children.map(
                  (entry) =>
                    `${entry.person.fullName}${entry.relationType === "ADOPTIVE" ? " (nuôi)" : ""}`,
                )}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu quan hệ.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RelationGroup({ title, entries }: { title: string; entries: string[] }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {entries.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Chưa có</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm">
          {entries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BranchNode({
  branch,
  canManage,
  persons,
  onChanged,
  onEdit,
}: {
  branch: BranchTreeNode;
  canManage: boolean;
  persons: PersonRecord[];
  onChanged: () => Promise<void>;
  onEdit: (branch: BranchRecord) => void;
}) {
  const members = persons.filter((person) => person.branchId === branch.id);
  const [headSelection, setHeadSelection] = useState<string>("auto");

  async function applyHead() {
    try {
      await transferLeadership(branch.id, {
        successorPersonId: headSelection === "auto" ? undefined : headSelection,
      });
      toast.success("Đã cập nhật trưởng chi.");
      setHeadSelection("auto");
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{branch.name}</span>
            <Badge variant="outline">{branch.type}</Badge>
            <Badge variant={branch.status === "ACTIVE" ? "secondary" : "outline"}>
              {branch.status === "ACTIVE" ? "Đang dùng" : "Lưu trữ"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Trưởng chi: {personName(persons, branch.headPersonId)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canManage}
            onClick={() => onEdit(branch)}
          >
            Sửa
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={!canManage || branch.status === "ARCHIVED"}
            onClick={async () => {
              await archiveBranch(branch.id);
              toast.success("Đã lưu trữ chi/nhánh.");
              await onChanged();
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {canManage ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <SelectField
              label="Trưởng chi"
              value={headSelection}
              options={[
                { value: "auto", label: "Tự động (con trai trưởng)" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.fullName,
                })),
              ]}
              onChange={setHeadSelection}
            />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void applyHead()}>
            Chuyển giao
          </Button>
        </div>
      ) : null}

      {branch.children.length ? (
        <div className="mt-3 space-y-3 border-l pl-3">
          {branch.children.map((child) => (
            <BranchNode
              key={child.id}
              branch={child}
              canManage={canManage}
              persons={persons}
              onChanged={onChanged}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PersonList({
  branches,
  canManage,
  persons,
  onDelete,
  onEdit,
}: {
  branches: BranchRecord[];
  canManage: boolean;
  persons: PersonRecord[];
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (person: PersonRecord) => void;
}) {
  if (persons.length === 0) {
    return <EmptyState text="Chưa có thành viên." />;
  }

  return (
    <div className="grid gap-3">
      {persons.map((person) => (
        <div
          key={person.id}
          className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="font-medium hover:underline" href={`/people/${person.id}`}>
                {person.fullName}
              </Link>
              <Badge variant="outline">{genderLabels[person.gender]}</Badge>
              <Badge variant={person.lifeStatus === "DECEASED" ? "outline" : "secondary"}>
                {lifeStatusLabels[person.lifeStatus]}
              </Badge>
              {!person.isClanMember ? <Badge variant="outline">Dâu/rể</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {branchName(branches, person.branchId)} · Đời{" "}
              {person.generationNumber ?? "chưa rõ"}
            </p>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(person)}
              >
                Sửa
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => void onDelete?.(person.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TreeNode({ node }: { node: FamilyTreeNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="min-w-56 rounded-md border bg-card p-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="font-medium">{node.person.fullName}</span>
          {node.relationType === "ADOPTIVE" ? (
            <Badge variant="outline">nuôi</Badge>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Đời {node.person.generationNumber ?? "?"} · {genderLabels[node.person.gender]}
        </div>
        {node.spouses.length ? (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {node.spouses.map((spouse) => (
              <Badge key={spouse.marriageId} variant="secondary">
                ♥ {spouse.person.fullName}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {node.children.length ? (
        <div className="flex gap-4 border-t pt-4">
          {node.children.map((child) => (
            <TreeNode key={child.person.id} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LunarFields({
  prefix,
  year,
  month,
  day,
  isLeap,
  onChange,
}: {
  prefix: "birth" | "death";
  year: string;
  month: string;
  day: string;
  isLeap?: boolean;
  onChange: (patch: Partial<PersonFormState>) => void;
}) {
  const key = (suffix: string) =>
    `${prefix}Lunar${suffix}` as keyof PersonFormState;
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Âm lịch (tùy chọn)</Label>
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          placeholder="Năm"
          value={year}
          onChange={(event) => onChange({ [key("Year")]: event.target.value })}
        />
        <Input
          type="number"
          placeholder="Tháng"
          value={month}
          onChange={(event) => onChange({ [key("Month")]: event.target.value })}
        />
        <Input
          type="number"
          placeholder="Ngày"
          value={day}
          onChange={(event) => onChange({ [key("Day")]: event.target.value })}
        />
      </div>
      {prefix === "birth" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(isLeap)}
            onChange={(event) =>
              onChange({ birthLunarIsLeapMonth: event.target.checked })
            }
          />
          Tháng nhuận
        </label>
      ) : null}
    </div>
  );
}

function RelationRow({
  children,
  canManage,
  onDelete,
}: {
  children: ReactNode;
  canManage: boolean;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <span>{children}</span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={!canManage}
        onClick={() => void onDelete()}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm theo tên, tên thường gọi hoặc quê quán"
      />
    </div>
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => nextValue && onChange(nextValue)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value || "Chưa có"}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-36 rounded-md" />
      <Skeleton className="h-36 rounded-md" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getTitle(view: GenealogyView) {
  const titles: Record<GenealogyView, string> = {
    overview: "Quản lý gia phả",
    clan: "Cấu hình dòng họ",
    branches: "Chi/nhánh",
    persons: "Thành viên",
    relationships: "Quan hệ gia đình",
    tree: "Cây phả hệ",
    people: "Tra cứu thành viên",
    "person-detail": "Hồ sơ thành viên",
  };

  return titles[view];
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không xử lý được dữ liệu gia phả.";
}

function normalizePayload<T extends object>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? undefined : value,
    ]),
  ) as T;
}

function buildPersonPayload(form: PersonFormState): PersonPayload {
  const deceased = form.lifeStatus === "DECEASED";
  return {
    fullName: form.fullName.trim(),
    commonName: optional(form.commonName),
    gender: form.gender as Gender,
    isClanMember: form.isClanMember,
    branchId: form.branchId,
    generationNumber: toNumber(form.generationNumber),
    displayOrder: toNumber(form.displayOrder),
    birthSolarDate: optional(form.birthSolarDate),
    birthLunarYear: toNumber(form.birthLunarYear),
    birthLunarMonth: toNumber(form.birthLunarMonth),
    birthLunarDay: toNumber(form.birthLunarDay),
    birthLunarIsLeapMonth: form.birthLunarIsLeapMonth || undefined,
    lifeStatus: form.lifeStatus,
    deathSolarDate: deceased ? optional(form.deathSolarDate) : undefined,
    deathLunarYear: deceased ? toNumber(form.deathLunarYear) : undefined,
    deathLunarMonth: deceased ? toNumber(form.deathLunarMonth) : undefined,
    deathLunarDay: deceased ? toNumber(form.deathLunarDay) : undefined,
    burialPlace: deceased ? optional(form.burialPlace) : undefined,
    deathNote: deceased ? optional(form.deathNote) : undefined,
    hometown: optional(form.hometown),
    currentLocation: optional(form.currentLocation),
    biography: optional(form.biography),
  };
}

function personToForm(person: PersonRecord): PersonFormState {
  return {
    fullName: person.fullName,
    commonName: person.commonName ?? "",
    gender: person.gender,
    isClanMember: person.isClanMember,
    branchId: person.branchId,
    generationNumber: person.generationNumber?.toString() ?? "",
    displayOrder: person.displayOrder?.toString() ?? "0",
    birthSolarDate: person.birthSolarDate ?? "",
    birthLunarYear: person.birthLunarYear?.toString() ?? "",
    birthLunarMonth: person.birthLunarMonth?.toString() ?? "",
    birthLunarDay: person.birthLunarDay?.toString() ?? "",
    birthLunarIsLeapMonth: person.birthLunarIsLeapMonth,
    lifeStatus: person.lifeStatus,
    deathSolarDate: person.deathSolarDate ?? "",
    deathLunarYear: person.deathLunarYear?.toString() ?? "",
    deathLunarMonth: person.deathLunarMonth?.toString() ?? "",
    deathLunarDay: person.deathLunarDay?.toString() ?? "",
    burialPlace: person.burialPlace ?? "",
    deathNote: person.deathNote ?? "",
    hometown: person.hometown ?? "",
    currentLocation: person.currentLocation ?? "",
    biography: person.biography ?? "",
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function personOptions(persons: PersonRecord[]) {
  return persons.map((person) => ({
    value: person.id,
    label: `${person.fullName}${person.commonName ? ` (${person.commonName})` : ""}`,
  }));
}

function personName(persons: PersonRecord[], personId?: string) {
  return persons.find((person) => person.id === personId)?.fullName ?? "Chưa chọn";
}

function branchName(branches: BranchRecord[], branchId?: string) {
  return (
    branches.find((branch) => branch.id === branchId)?.name ?? "Chưa gán chi/nhánh"
  );
}

function parentRoleLabel(role: ParentRole, type: ParentRelationType) {
  const roleLabel = role === "FATHER" ? "cha" : "mẹ";
  return type === "ADOPTIVE" ? `${roleLabel} nuôi` : `${roleLabel} ruột`;
}

function formatLunar(person: PersonRecord) {
  if (!person.birthLunarYear) return undefined;
  return `${person.birthLunarDay}/${person.birthLunarMonth}/${person.birthLunarYear}${
    person.birthLunarIsLeapMonth ? " (nhuận)" : ""
  }`;
}
