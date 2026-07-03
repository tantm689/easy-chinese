import Link from "next/link";
import { getLessonsByTopic } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function TopicLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lessons = await getLessonsByTopic(id);
  
  // Lấy tên topic để hiển thị
  const { data: topic } = await supabase.from('topics').select('title').eq('id', id).single();
  if (!topic) notFound();

  return (
    <main className="min-h-screen flex flex-col pt-12 md:pt-20 px-6 max-w-3xl mx-auto">
      <div className="mb-10 animate-fade-in-up">
        <Link 
          href="/topics" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#25221c] text-foreground/80 hover:text-primary rounded-full shadow-sm border border-black/5 dark:border-white/5 transition-all hover:shadow hover:-translate-y-0.5 mb-8 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Các bài học: <span className="text-primary">{topic.title}</span>
        </h1>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm">
          <p className="text-foreground/60">Chưa có bài học nào trong chủ đề này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <Link 
              href={`/lessons/${lesson.id}`} 
              key={lesson.id}
              className="block group bg-white dark:bg-[#25221c] p-6 rounded-[var(--radius-card)] shadow-sm hover:shadow-md border border-black/5 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary font-bold text-lg rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                  {lesson.order_index}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h2>
                </div>
                <div className="ml-auto text-primary/30 group-hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
