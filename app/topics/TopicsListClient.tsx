"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topic, Lesson, UserProgress, getUserProgressOverview } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export default function TopicsListClient({ 
  topics, 
  lessons 
}: { 
  topics: Topic[], 
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

  return (
    <>
      {topics.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm">
          <p className="text-foreground/60">Chưa có chủ đề nào được tạo.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            topics.reduce((acc, topic) => {
              const level = topic.level || 'Khác';
              if (!acc[level]) acc[level] = [];
              acc[level].push(topic);
              return acc;
            }, {} as Record<string, typeof topics>)
          ).map(([level, groupTopics]) => (
            <div key={level} className="animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-black/5 dark:bg-white/10 flex-1"></div>
                <h2 className="text-2xl font-bold text-[#5C5446] dark:text-white/80 uppercase tracking-wider">
                  {level}
                </h2>
                <div className="h-px bg-black/5 dark:bg-white/10 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {groupTopics.map((topic, index) => {
                  // Lấy danh sách lesson của topic này
                  const topicLessons = lessons.filter(l => l.topic_id === topic.id);
                  const totalLessons = topicLessons.length;
                  
                  // Tính số bài học đã completed
                  const completedCount = topicLessons.filter(l => 
                    progressData.some(p => p.lesson_id === l.id && p.status === 'completed')
                  ).length;

                  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                  return (
                    <Link href={`/topics/${topic.id}/lessons`} key={topic.id}>
                      {/* Card Container */}
                      <div 
                        className="group relative bg-white dark:bg-[#25221c] p-6 rounded-[var(--radius-card)] shadow-sm hover:shadow-md border border-black/5 dark:border-white/5 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden h-full flex flex-col"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Viền cong nhẹ trang trí ở góc */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-transform duration-500 group-hover:scale-110"></div>
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="w-14 h-14 flex items-center justify-center bg-primary/10 text-primary text-3xl rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            {topic.icon || "📚"}
                          </div>
                          {topic.level && (
                            <span className="px-3 py-1 bg-accent/20 text-accent dark:text-[#E8C55A] text-sm font-semibold rounded-full border border-accent/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                              {topic.level}
                            </span>
                          )}
                        </div>
                        
                        <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex-1">
                          {topic.title}
                        </h2>
                        
                        {/* Real Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-foreground/50 mb-2 font-medium">
                            <span>Tiến độ ({completedCount}/{totalLessons})</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
