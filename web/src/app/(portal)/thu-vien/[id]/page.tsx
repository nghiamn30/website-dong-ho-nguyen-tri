import { PortalAlbumDetail } from "@/components/portal/portal-album-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalAlbumDetail albumId={id} />;
}
