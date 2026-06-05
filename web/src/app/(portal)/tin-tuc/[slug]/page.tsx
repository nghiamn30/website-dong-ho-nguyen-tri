import { PortalPostDetail } from "@/components/portal/portal-post-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PortalPostDetail slug={slug} />;
}
