import Link from "next/link";
import { getLessonDetail } from "@/lib/queries";
import { notFound } from "next/navigation";
import PatternsClient from "./PatternsClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { lesson } = await getLessonDetail(id);
    return { title: `Câu mẫu: ${lesson.title} - Chinese Learning App` };
  } catch (error) {
    return { title: "Câu mẫu không tồn tại" };
  }
}

export default async function PatternsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let lessonData;
  
  try {
    lessonData = await getLessonDetail(id);
  } catch (error) {
    notFound();
  }

  const { lesson, sentencePatterns } = lessonData;

  const steps = [
    { label: "Bài khóa", bg: "#C1272D" },     // Done
    { label: "Từ vựng", bg: "#C1272D" },      // Done
    { label: "Luyện từ", bg: "#C1272D" },     // Done
    { label: "Câu mẫu", bg: "#C1272D" },      // Current
    { label: "Luyện câu", bg: "#EADFC6" }
  ];

  return (
    <div className="min-h-screen pb-12 font-sans bg-[#FBF6EC] dark:bg-background text-[#2B2622] dark:text-foreground flex justify-center">
      <div className="w-full max-w-[660px] px-5">
        
        {/* Top bar: progress */}
        <div className="sticky top-0 z-20 pt-5 pb-3.5 bg-gradient-to-b from-[#FBF6EC] to-[#FBF6EC]/0 dark:from-background dark:to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Link href={`/lessons/${id}/vocab-exercise`} className="text-foreground/70 hover:text-[#C1272D] transition-colors p-2 -ml-2 rounded-full hover:bg-[#C1272D]/10 flex-shrink-0">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div className="w-[34px] h-[34px] rounded-[11px] bg-[#C1272D] text-[#F6D98B] flex items-center justify-center font-serif font-bold text-[19px] shadow-[0_3px_10px_rgba(193,39,45,0.28)]">
                句
              </div>
              <div className="font-bold text-[15px] tracking-wide">Bước 4/5 · Câu mẫu</div>
            </div>
            <div className="text-[13px] font-semibold text-[#9A8F7E] dark:text-white/40">80%</div>
          </div>
          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div key={i} title={s.label} className="flex-1 h-1.5 rounded-full transition-colors" style={{ backgroundColor: s.bg }}></div>
            ))}
          </div>
        </div>

        {/* Lesson header */}
        <div className="relative mt-1.5 mb-[22px] bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 border border-[#EFE4CE] dark:border-white/10 rounded-[24px] px-[26px] pt-[26px] pb-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] dark:shadow-none overflow-hidden animate-fade-in-up">
          <div className="absolute top-[18px] right-[18px] w-[52px] h-[52px] rounded-xl border-2 border-[#D4AF37] text-[#C1272D] flex items-center justify-center font-serif font-bold text-[15px] leading-tight text-center opacity-85 rotate-[4deg]">
            第<br/>{lesson.order_index}课
          </div>
          <div className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#C1272D] mb-2">Mẫu câu quan trọng</div>
          <div className="font-serif text-[30px] font-bold tracking-wide mb-1.5 leading-tight">{lesson.title}</div>
          
          <div className="flex items-center gap-3.5 mt-[18px] pt-4 border-t border-dashed border-[#EADEC4] dark:border-white/10 flex-wrap">
            <div className="text-[13px] font-semibold text-[#8A8071]">
              Các cấu trúc ngữ pháp cần nhớ trong bài
            </div>
            <div className="ml-auto text-[13px] text-[#A89C88] font-semibold">{sentencePatterns.length} mẫu câu</div>
          </div>
        </div>

        {/* Patterns list */}
        <PatternsClient patterns={sentencePatterns} lessonId={id} />

        {/* Next button */}
        <Link 
          href={`/lessons/${id}/sentence-exercise`}
          className="flex items-center justify-center gap-2.5 w-full mt-[30px] bg-[#C1272D] text-[#FFF6E4] font-bold text-[17px] p-[17px] rounded-[18px] shadow-[0_10px_24px_rgba(193,39,45,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(193,39,45,0.34)] active:translate-y-0"
        >
          Luyện tập <span className="text-[19px]">→</span>
        </Link>
        <div className="text-center mt-3 text-[13px] text-[#A89C88] font-semibold">Tiếp theo: Luyện câu</div>

      </div>
    </div>
  );
}
