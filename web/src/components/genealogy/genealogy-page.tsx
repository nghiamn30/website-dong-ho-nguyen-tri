"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
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
  createBranch,
  createPerson,
  createRelationship,
  deletePerson,
  deleteRelationship,
  FamilyTreeNode,
  FamilyTreeRecord,
  getBranches,
  getBranchTree,
  getClan,
  getFamilyTree,
  getPersons,
  getRelationships,
  PersonPayload,
  PersonRecord,
  RelationshipPayload,
  RelationshipRecord,
  saveClan,
  updateBranch,
  updatePerson,
  type BranchTreeNode,
  type ClanPayload,
  type ClanRecord,
  type Gender,
  type LifeStatus,
  type RelationshipType,
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

const emptyClan: ClanPayload = {
  name: "Dòng họ Nguyễn Trí",
  description: "",
  history: "",
  founderPersonId: undefined,
  logoUrl: "",
  bannerUrl: "",
  ancestralHouseName: "",
  ancestralHouseAddress: "",
  contactInformation: "",
};

const emptyBranch: BranchPayload = {
  name: "",
  type: "Chi",
  parentBranchId: undefined,
  headPersonId: undefined,
  description: "",
  displayOrder: 0,
};

const emptyPerson: PersonPayload = {
  fullName: "",
  commonName: "",
  gender: "UNKNOWN",
  branchId: undefined,
  generationNumber: undefined,
  birthDate: "",
  birthCalendarType: "SOLAR",
  lifeStatus: "LIVING",
  isBranchHead: false,
  biography: "",
  hometown: "",
  currentLocation: "",
};

const emptyRelationship: RelationshipPayload = {
  person1Id: "",
  person2Id: "",
  relationshipType: "FATHER",
  note: "",
};

const genderLabels: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
  UNKNOWN: "Chưa rõ",
};

const lifeStatusLabels: Record<LifeStatus, string> = {
  LIVING: "Còn sống",
  DECEASED: "Đã mất",
  UNKNOWN: "Chưa rõ",
};

const relationshipLabels: Record<RelationshipType, string> = {
  FATHER: "Cha của",
  MOTHER: "Mẹ của",
  SPOUSE: "Vợ/chồng",
  CHILD: "Con của",
  ADOPTED_CHILD: "Cha/mẹ nuôi của",
};

export function GenealogyPage({ view, personId, branchId }: GenealogyPageProps) {
  const { user, status } = useAuth();
  const [clan, setClan] = useState<ClanRecord | null>(null);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [branchTree, setBranchTree] = useState<BranchTreeNode[]>([]);
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [familyTree, setFamilyTree] = useState<FamilyTreeRecord | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null);
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
      const [nextClan, nextBranches, nextBranchTree, nextPersons, nextRelationships] =
        await Promise.all([
          getClan(),
          getBranches(),
          getBranchTree(),
          getPersons(search || undefined, branchId),
          getRelationships(),
        ]);
      const nextTree = await getFamilyTree({ branchId, personId });
      const nextSelectedPerson = personId
        ? nextPersons.find((person) => person.id === personId) ?? null
        : null;

      setClan(nextClan);
      setBranches(nextBranches);
      setBranchTree(nextBranchTree);
      setPersons(nextPersons);
      setRelationships(nextRelationships);
      setFamilyTree(nextTree);
      setSelectedPerson(nextSelectedPerson);
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
  }, [status, branchId, personId]);

  const metrics = useMemo(
    () => ({
      activeBranches: branches.filter((branch) => branch.status === "ACTIVE").length,
      persons: persons.length,
      branchHeads: persons.filter((person) => person.isBranchHead).length,
      relationships: relationships.length,
    }),
    [branches, persons, relationships],
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

      <Alert>
        <Network className="size-4" />
        <AlertTitle>Quyết định phả đồ G01-M01</AlertTitle>
        <AlertDescription>
          Chưa thêm React Flow ở giai đoạn này. Phả đồ dùng render phân cấp bằng
          React/CSS để giữ dependency gọn; React Flow sẽ được xem lại khi cây lớn,
          cần kéo thả node hoặc export nâng cao.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Lỗi dữ liệu gia phả</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {view === "overview" ? (
        <Overview metrics={metrics} clan={clan} />
      ) : null}
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
          relationships={relationships}
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
          relationships={relationships}
          persons={persons}
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
      <MetricCard icon={Network} label="Quan hệ" value={metrics.relationships} />
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>{clan?.name ?? "Chưa cấu hình dòng họ"}</CardTitle>
          <CardDescription>
            {clan?.description ?? "Bắt đầu bằng cấu hình dòng họ và tạo thủy tổ."}
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
          Thủy tổ được dùng làm node gốc của phả đồ toàn họ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Tên dòng họ" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <SelectField
              label="Thủy tổ"
              value={form.founderPersonId ?? "none"}
              options={[
                { value: "none", label: "Chưa chọn" },
                ...persons.map((person) => ({ value: person.id, label: person.fullName })),
              ]}
              onChange={(value) =>
                setForm({ ...form, founderPersonId: value === "none" ? undefined : value })
              }
            />
            <TextField label="Tên từ đường" value={form.ancestralHouseName ?? ""} onChange={(value) => setForm({ ...form, ancestralHouseName: value })} />
            <TextField label="Liên hệ" value={form.contactInformation ?? ""} onChange={(value) => setForm({ ...form, contactInformation: value })} />
          </div>
          <TextareaField label="Mô tả" value={form.description ?? ""} onChange={(value) => setForm({ ...form, description: value })} />
          <TextareaField label="Lịch sử" value={form.history ?? ""} onChange={(value) => setForm({ ...form, history: value })} />
          <TextareaField label="Địa chỉ từ đường" value={form.ancestralHouseAddress ?? ""} onChange={(value) => setForm({ ...form, ancestralHouseAddress: value })} />
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
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <TextField label="Tên chi/nhánh" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <TextField label="Loại" value={form.type ?? "Chi"} onChange={(type) => setForm({ ...form, type })} />
            <SelectField
              label="Chi/nhánh cha"
              value={form.parentBranchId ?? "none"}
              options={[
                { value: "none", label: "Không có" },
                ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
              ]}
              onChange={(value) => setForm({ ...form, parentBranchId: value === "none" ? undefined : value })}
            />
            <SelectField
              label="Người đứng đầu"
              value={form.headPersonId ?? "none"}
              options={[
                { value: "none", label: "Chưa chọn" },
                ...persons.map((person) => ({ value: person.id, label: person.fullName })),
              ]}
              onChange={(value) => setForm({ ...form, headPersonId: value === "none" ? undefined : value })}
            />
            <TextField
              label="Thứ tự"
              type="number"
              value={String(form.displayOrder ?? 0)}
              onChange={(value) => setForm({ ...form, displayOrder: Number(value) || 0 })}
            />
            <TextareaField label="Mô tả" value={form.description ?? ""} onChange={(description) => setForm({ ...form, description })} />
            <div className="flex gap-2">
              <Button type="submit" disabled={!canManage}>
                <Save data-icon="inline-start" />
                Lưu
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyBranch); }}>
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
                  onArchive={async (id) => {
                    await archiveBranch(id);
                    toast.success("Đã lưu trữ chi/nhánh.");
                    await onChanged();
                  }}
                  onEdit={(branchRecord) => {
                    setEditingId(branchRecord.id);
                    setForm({
                      name: branchRecord.name,
                      type: branchRecord.type,
                      parentBranchId: branchRecord.parentBranchId,
                      headPersonId: branchRecord.headPersonId,
                      displayOrder: branchRecord.displayOrder,
                      description: branchRecord.description ?? "",
                    });
                  }}
                  canManage={canManage}
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
  const [form, setForm] = useState<PersonPayload>(emptyPerson);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = normalizePersonPayload(form);
      if (editingId) {
        await updatePerson(editingId, payload);
        toast.success("Đã cập nhật thành viên.");
      } else {
        await createPerson(payload);
        toast.success("Đã thêm thành viên.");
      }
      setEditingId(null);
      setForm(emptyPerson);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Sửa thành viên" : "Thêm thành viên"}</CardTitle>
          <CardDescription>Thông tin cá nhân được mọi người trong hệ thống xem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <TextField label="Họ tên" value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} required />
            <TextField label="Tên thường gọi" value={form.commonName ?? ""} onChange={(commonName) => setForm({ ...form, commonName })} />
            <SelectField
              label="Chi/nhánh"
              value={form.branchId ?? "none"}
              options={[
                { value: "none", label: "Chưa gán" },
                ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
              ]}
              onChange={(value) => setForm({ ...form, branchId: value === "none" ? undefined : value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Giới tính"
                value={form.gender ?? "UNKNOWN"}
                options={Object.entries(genderLabels).map(([value, label]) => ({ value, label }))}
                onChange={(value) => setForm({ ...form, gender: value as Gender })}
              />
              <TextField
                label="Đời thứ"
                type="number"
                value={form.generationNumber ? String(form.generationNumber) : ""}
                onChange={(value) => setForm({ ...form, generationNumber: value ? Number(value) : undefined })}
              />
              <TextField label="Ngày sinh" type="date" value={form.birthDate ?? ""} onChange={(birthDate) => setForm({ ...form, birthDate })} />
              <SelectField
                label="Trạng thái"
                value={form.lifeStatus ?? "LIVING"}
                options={Object.entries(lifeStatusLabels).map(([value, label]) => ({ value, label }))}
                onChange={(value) => setForm({ ...form, lifeStatus: value as LifeStatus })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.isBranchHead)}
                onChange={(event) => setForm({ ...form, isBranchHead: event.target.checked })}
              />
              Là người đứng đầu chi/nhánh
            </label>
            <TextField label="Quê quán" value={form.hometown ?? ""} onChange={(hometown) => setForm({ ...form, hometown })} />
            <TextField label="Nơi sinh sống" value={form.currentLocation ?? ""} onChange={(currentLocation) => setForm({ ...form, currentLocation })} />
            <TextareaField label="Tiểu sử/Ghi chú" value={form.biography ?? ""} onChange={(biography) => setForm({ ...form, biography })} />
            <div className="flex gap-2">
              <Button type="submit" disabled={!canManage}>
                <Save data-icon="inline-start" />
                Lưu
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyPerson); }}>
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
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm thành viên" />
          </div>
        </CardHeader>
        <CardContent>
          <PersonList
            branches={branches}
            canManage={canManage}
            persons={persons}
            onDelete={async (id) => {
              await deletePerson(id);
              toast.success("Đã xoá thành viên.");
              await onChanged();
            }}
            onEdit={(person) => {
              setEditingId(person.id);
              setForm({
                fullName: person.fullName,
                commonName: person.commonName ?? "",
                gender: person.gender,
                branchId: person.branchId,
                generationNumber: person.generationNumber,
                birthDate: person.birthDate ?? "",
                birthCalendarType: person.birthCalendarType,
                lifeStatus: person.lifeStatus,
                isBranchHead: person.isBranchHead,
                biography: person.biography ?? "",
                hometown: person.hometown ?? "",
                currentLocation: person.currentLocation ?? "",
              });
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
  relationships,
  onChanged,
}: {
  canManage: boolean;
  persons: PersonRecord[];
  relationships: RelationshipRecord[];
  onChanged: () => Promise<void>;
}) {
  const [form, setForm] = useState<RelationshipPayload>(emptyRelationship);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createRelationship(normalizePayload<RelationshipPayload>(form));
      toast.success("Đã tạo quan hệ.");
      setForm(emptyRelationship);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Gắn quan hệ</CardTitle>
          <CardDescription>Quan hệ cha/mẹ/con dùng để dựng phả đồ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <SelectField
              label="Người thứ nhất"
              value={form.person1Id || "none"}
              options={[{ value: "none", label: "Chọn thành viên" }, ...personOptions(persons)]}
              onChange={(value) => setForm({ ...form, person1Id: value === "none" ? "" : value })}
            />
            <SelectField
              label="Quan hệ"
              value={form.relationshipType}
              options={Object.entries(relationshipLabels).map(([value, label]) => ({ value, label }))}
              onChange={(value) => setForm({ ...form, relationshipType: value as RelationshipType })}
            />
            <SelectField
              label="Người thứ hai"
              value={form.person2Id || "none"}
              options={[{ value: "none", label: "Chọn thành viên" }, ...personOptions(persons)]}
              onChange={(value) => setForm({ ...form, person2Id: value === "none" ? "" : value })}
            />
            <TextareaField label="Ghi chú" value={form.note ?? ""} onChange={(note) => setForm({ ...form, note })} />
            <Button type="submit" disabled={!canManage || !form.person1Id || !form.person2Id}>
              <Save data-icon="inline-start" />
              Lưu quan hệ
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quan hệ đã ghi nhận</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {relationships.length === 0 ? (
            <EmptyState text="Chưa có quan hệ." />
          ) : (
            relationships.map((relationship) => (
              <div key={relationship.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <span>
                  <strong>{personName(persons, relationship.person1Id)}</strong>{" "}
                  {relationshipLabels[relationship.relationshipType]}{" "}
                  <strong>{personName(persons, relationship.person2Id)}</strong>
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!canManage}
                  onClick={async () => {
                    await deleteRelationship(relationship.id);
                    toast.success("Đã xoá quan hệ.");
                    await onChanged();
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
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
          <EmptyState text="Chưa xác định được node gốc của phả đồ." />
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
          <CardDescription>Thông tin cá nhân trong gia phả không phân quyền đọc.</CardDescription>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={async (event) => {
              onSearchChange(event.target.value);
              await onRefresh();
            }}
            placeholder="Tìm theo tên, tên thường gọi hoặc quê quán"
          />
        </div>
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
  persons,
  relationships,
}: {
  branches: BranchRecord[];
  person: PersonRecord | null;
  persons: PersonRecord[];
  relationships: RelationshipRecord[];
}) {
  if (!person) {
    return <EmptyState text="Không tìm thấy thành viên." />;
  }

  const related = relationships.filter(
    (relationship) =>
      relationship.person1Id === person.id || relationship.person2Id === person.id,
  );

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
        <Info label="Ngày sinh" value={person.birthDate} />
        <Info label="Quê quán" value={person.hometown} />
        <Info label="Nơi sinh sống" value={person.currentLocation} />
        <Info label="Người đứng đầu chi/nhánh" value={person.isBranchHead ? "Có" : "Không"} />
        <div className="md:col-span-2">
          <Info label="Tiểu sử/Ghi chú" value={person.biography} />
        </div>
        <div className="md:col-span-2">
          <h3 className="mb-2 text-sm font-medium">Quan hệ</h3>
          {related.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có quan hệ.</p>
          ) : (
            <div className="space-y-2">
              {related.map((relationship) => (
                <Badge key={relationship.id} variant="outline">
                  {personName(persons, relationship.person1Id)}{" "}
                  {relationshipLabels[relationship.relationshipType]}{" "}
                  {personName(persons, relationship.person2Id)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BranchNode({
  branch,
  canManage,
  persons,
  onArchive,
  onEdit,
}: {
  branch: BranchTreeNode;
  canManage: boolean;
  persons: PersonRecord[];
  onArchive: (id: string) => Promise<void>;
  onEdit: (branch: BranchRecord) => void;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
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
          <Button type="button" size="sm" variant="outline" disabled={!canManage} onClick={() => onEdit(branch)}>
            Sửa
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || branch.status === "ARCHIVED"} onClick={() => void onArchive(branch.id)}>
            <Trash2 />
          </Button>
        </div>
      </div>
      {branch.children.length ? (
        <div className="mt-3 space-y-3 border-l pl-3">
          {branch.children.map((child) => (
            <BranchNode key={child.id} branch={child} canManage={canManage} persons={persons} onArchive={onArchive} onEdit={onEdit} />
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
        <div key={person.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="font-medium hover:underline" href={`/people/${person.id}`}>
                {person.fullName}
              </Link>
              {person.isBranchHead ? <Badge variant="secondary">Đứng đầu chi/nhánh</Badge> : null}
              <Badge variant="outline">{lifeStatusLabels[person.lifeStatus]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {branchName(branches, person.branchId)} · Đời {person.generationNumber ?? "chưa rõ"}
            </p>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onEdit?.(person)}>
                Sửa
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => void onDelete?.(person.id)}>
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
        <div className="font-medium">{node.person.fullName}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Đời {node.person.generationNumber ?? "?"}
        </div>
        {node.spouses.length ? (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {node.spouses.map((spouse) => (
              <Badge key={spouse.id} variant="outline">
                {spouse.fullName}
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
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
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
  return <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{text}</div>;
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
  return error instanceof ApiError ? error.message : "Không xử lý được dữ liệu gia phả.";
}

function normalizePayload<T extends object>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? undefined : value,
    ]),
  ) as T;
}

function normalizePersonPayload(payload: PersonPayload): PersonPayload {
  return normalizePayload(payload);
}

function personOptions(persons: PersonRecord[]) {
  return persons.map((person) => ({ value: person.id, label: person.fullName }));
}

function personName(persons: PersonRecord[], personId?: string) {
  return persons.find((person) => person.id === personId)?.fullName ?? "Chưa chọn";
}

function branchName(branches: BranchRecord[], branchId?: string) {
  return branches.find((branch) => branch.id === branchId)?.name ?? "Chưa gán chi/nhánh";
}
