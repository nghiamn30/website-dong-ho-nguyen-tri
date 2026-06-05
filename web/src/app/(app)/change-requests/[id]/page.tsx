import { ChangeRequestDetailPage } from "@/components/change-requests/change-request-detail-page";

export default async function ChangeRequestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChangeRequestDetailPage id={id} />;
}
