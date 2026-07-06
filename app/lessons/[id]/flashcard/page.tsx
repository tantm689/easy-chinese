import { getFlashcardData, getLessonDetail } from "@/lib/queries";
import { notFound } from "next/navigation";
import FlashcardClient from "./FlashcardClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { lesson } = await getLessonDetail(id);
    return { title: `Thẻ ghi nhớ: ${lesson.title} - Chinese Learning App` };
  } catch (error) {
    return { title: "Thẻ ghi nhớ không tồn tại" };
  }
}

export default async function FlashcardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    // Gọi song song để tiết kiệm thời gian
    const [{ lesson }, flashcards] = await Promise.all([
      getLessonDetail(id),
      getFlashcardData(id)
    ]);

    if (!lesson) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-[#FBF6EC] dark:bg-background text-[#2B2622] dark:text-foreground">
        <FlashcardClient 
          initialCards={flashcards} 
          lessonTitle={lesson.title} 
          topicId={lesson.topic_id}
          lessonId={id}
        />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
