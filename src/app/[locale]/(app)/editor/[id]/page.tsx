import { EditorPage } from "@/components/editor/EditorPage";

export default async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorPage bookletId={id} />;
}
