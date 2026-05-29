import { GenealogyPage } from "@/components/genealogy/genealogy-page";

export default async function ManagedPersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GenealogyPage view="person-detail" personId={id} />;
}

