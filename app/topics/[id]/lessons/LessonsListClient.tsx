"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lesson, UserProgress, getUserProgressOverview } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export default function LessonsListClient({ 
  lessons 
}: { 
  lessons: Lesson[] 
}) {
  const [progressData, setProgressData] = useState<UserProgress[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const data = await getUserProgressOverview(session.user.id);
        setProgressData(data);
      }
    };
    fetchProgress();
  }, []);

  if (lessons.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm">
        <p className="text-foreground/60">Chưa có bài học nào trong chủ đề này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson, index) => {
        const progress = progressData.find(p => p.lesson_id === lesson.id);
        const isCompleted = progress?.status === 'completed';
        const isInProgress = progress?.status === 'in_progress';

        return (
          <div 
            key={lesson.id}
            className="block group bg-white dark:bg-[#25221c] p-6 rounded-[var(--radius-card)] shadow-sm hover:shadow-md border border-black/5 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center font-bold text-lg rounded-full transition-colors ${
                  isCompleted 
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white"
                    : "bg-[#C1272D]/10 text-[#C1272D] group-hover:bg-[#C1272D] group-hover:text-white"
                }`}>
                  {isCompleted ? "✓" : lesson.order_index}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-[#C1272D] transition-colors">
                      {lesson.title}
                    </h2>
                    {isCompleted && (
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-md">
                        Hoàn thành
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#E8C55A]/20 text-[#D4AF37] border border-[#E8C55A]/40 rounded-md">
                        Đang học
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hành động */}
              <div className="flex items-center gap-2 mt-4 sm:mt-0 ml-[64px] sm:ml-0">
                {isCompleted ? (
                  <Link 
                    href={`/lessons/${lesson.id}/flashcard`}
                    className="flex items-center justify-center gap-2 bg-[#FFFDF8] border-2 border-[#EFE4CE] text-[#C1272D] font-bold text-[14px] px-4 py-2 rounded-xl transition-all hover:bg-[#FBF6EC] active:translate-y-0.5"
                    title="Ôn tập thẻ ghi nhớ"
                  >
                    <span className="text-lg leading-none">🗂️</span> Thẻ ghi nhớ
                  </Link>
                ) : (
                  <button 
                    disabled
                    className="flex items-center justify-center gap-2 bg-[#FFFDF8]/50 border-2 border-[#EFE4CE]/50 text-[#C1272D]/50 font-bold text-[14px] px-4 py-2 rounded-xl cursor-not-allowed"
                    title="Hoàn thành bài học để mở khóa Thẻ ghi nhớ"
                  >
                    <span className="text-lg leading-none grayscale opacity-50">🗂️</span> Thẻ ghi nhớ
                  </button>
                )}
                <Link 
                  href={`/lessons/${lesson.id}`}
                  className="flex items-center justify-center gap-2 bg-[#C1272D] text-[#FFF6E4] font-bold text-[14px] px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(193,39,45,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(193,39,45,0.28)] active:translate-y-0 border-2 border-transparent"
                >
                  {isCompleted || isInProgress ? "Tiếp tục học" : "Bắt đầu"} →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
