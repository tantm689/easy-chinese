import { redirect } from "next/navigation";
import { getLessonDetail } from "@/lib/queries";
import TranslationClient from "./TranslationClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { lesson } = await getLessonDetail(id);
    return { title: `Luyện dịch: ${lesson.title} - Chinese Learning App` };
  } catch {
    return { title: "Bài luyện dịch không tồn tại" };
  }
}

export default async function TranslationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    const { lesson, dialogueSentences, sentencePatterns } = await getLessonDetail(id);
    
    if (dialogueSentences.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl text-foreground/60">Chưa có câu hội thoại nào để luyện dịch.</p>
        </div>
      );
    }

    return <TranslationClient lesson={lesson} sentences={dialogueSentences} patterns={sentencePatterns} />;
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-foreground/60">Không tìm thấy bài học.</p>
      </div>
    );
  }
}
