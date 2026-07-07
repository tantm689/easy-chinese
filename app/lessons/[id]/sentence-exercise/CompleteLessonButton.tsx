"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { updateLessonProgress } from "@/lib/queries";
import { getMissingStep } from "@/lib/progressUtils";

export default function CompleteLessonButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [missingStep, setMissingStep] = useState<{ id: string, name: string, path: string } | null>(null);

  useEffect(() => {
    setMissingStep(getMissingStep(lessonId));
  }, [lessonId]);

  const handleComplete = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await updateLessonProgress(lessonId, 'completed', session.user.id);
    }
    router.push('/topics');
  };

  if (missingStep) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className="flex items-center justify-center gap-2.5 w-full mt-[30px] bg-[#C1272D]/50 text-[#FFF6E4]/70 font-bold text-[17px] p-[17px] rounded-[18px] cursor-not-allowed"
          title={`Vui lòng học phần "${missingStep.name}" trước`}
        >
          Hoàn thành bài học 🎉
        </button>
        <div className="text-center">
          <p className="text-[12px] text-[#A21E23] font-semibold mb-1">
            Bạn cần học qua <span className="font-bold">"{missingStep.name}"</span> trước khi hoàn thành bài học này.
          </p>
          <Link 
            href={`/lessons/${lessonId}/${missingStep.path}`}
            className="text-[13px] text-[#D4AF37] hover:text-[#C1272D] font-bold underline transition-colors"
          >
            Đến phần "{missingStep.name}" ngay →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleComplete}
      disabled={isLoading}
      className="flex items-center justify-center gap-2.5 w-full mt-[30px] bg-[#C1272D] text-[#FFF6E4] font-bold text-[17px] p-[17px] rounded-[18px] shadow-[0_10px_24px_rgba(193,39,45,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(193,39,45,0.34)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed h-[58px]"
    >
      {isLoading ? "Đang xử lý..." : "Hoàn thành bài học 🎉"}
    </button>
  );
}
