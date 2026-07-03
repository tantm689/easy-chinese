import { redirect } from "next/navigation";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Tự động chuyển hướng sang Bước 1 (Bài khóa)
  redirect(`/lessons/${id}/dialogue`);
}
