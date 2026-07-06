"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { updateLessonProgress } from "@/lib/queries";

export default function CompleteLessonButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await updateLessonProgress(lessonId, 'completed', session.user.id);
    }
    router.push('/topics');
  };

  return (
    <button
      onClick={handleComplete}
      disabled={isLoading}
      className="flex items-center justify-center gap-2.5 bg-[#C1272D] text-[#FFF6E4] font-bold text-[17px] p-[17px] rounded-[18px] shadow-[0_10px_24px_rgba(193,39,45,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(193,39,45,0.34)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Đang xử lý..." : "Hoàn thành bài học 🎉"}
    </button>
  );
}
