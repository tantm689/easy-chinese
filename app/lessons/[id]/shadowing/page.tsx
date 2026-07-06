import { getLessonDetail } from "@/lib/queries";
import ShadowingClient from "./ShadowingClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { lesson } = await getLessonDetail(id);
    return { title: `Shadowing: ${lesson.title} - Chinese Learning App` };
  } catch {
    return { title: "Bài Shadowing không tồn tại" };
  }
}

export default async function ShadowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    const { lesson, dialogueSentences } = await getLessonDetail(id);
    
    if (dialogueSentences.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl text-foreground/60">Chưa có dữ liệu bài khóa để luyện Shadowing.</p>
        </div>
      );
    }

    return <ShadowingClient lesson={lesson} sentences={dialogueSentences} />;
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-foreground/60">Không tìm thấy bài học.</p>
      </div>
    );
  }
}
