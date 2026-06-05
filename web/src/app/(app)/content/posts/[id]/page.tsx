import { PostEditorPage } from "@/components/content/post-editor-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostEditorPage mode="edit" postId={id} />;
}
