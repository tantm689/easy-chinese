import Link from "next/link";
import { getLessonsByTopic } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import AuthCheck from "@/components/AuthCheck";
import LessonsListClient from "./LessonsListClient";

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
    <AuthCheck>
      <main className="flex flex-col pt-8 pb-20 px-6 max-w-3xl mx-auto">
        <div className="mb-10 animate-fade-in-up">
          <Link 
            href="/topics" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#25221c] text-foreground/80 hover:text-[#C1272D] rounded-full shadow-sm border border-black/5 dark:border-white/5 transition-all hover:shadow hover:-translate-y-0.5 mb-8 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Các bài học: <span className="text-[#C1272D]">{topic.title}</span>
          </h1>
        </div>

        <LessonsListClient lessons={lessons} />
      </main>
    </AuthCheck>
  );
}
