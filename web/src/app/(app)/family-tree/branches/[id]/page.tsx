import { GenealogyPage } from "@/components/genealogy/genealogy-page";

export default async function BranchFamilyTreePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GenealogyPage view="tree" branchId={id} />;
}

