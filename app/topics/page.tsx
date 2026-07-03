import Link from "next/link";
import { getTopics } from "@/lib/queries";

export const metadata = {
  title: "Chủ đề học - Chinese Learning App",
};

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <main className="min-h-screen flex flex-col pt-12 md:pt-20 px-6 max-w-4xl mx-auto">
      <div className="mb-12 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center mb-4">
          <span className="text-5xl drop-shadow-md">🏮</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Lộ trình học thuật
        </h1>
        <p className="text-foreground/70 text-lg max-w-lg mx-auto">
          Chọn một chủ đề bên dưới để bắt đầu bài học của bạn.
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm">
          <p className="text-foreground/60">Chưa có chủ đề nào được tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {topics.map((topic, index) => (
            <Link href={`/topics/${topic.id}/lessons`} key={topic.id}>
              {/* Card Container */}
              <div 
                className="group relative bg-white dark:bg-[#25221c] p-6 rounded-[var(--radius-card)] shadow-sm hover:shadow-md border border-black/5 dark:border-white/5 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden"
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
                
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {topic.title}
                </h2>
                
                {/* Mock Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-foreground/50 mb-2 font-medium">
                    <span>Tiến độ</span>
                    <span>0%</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-0 group-hover:w-[10%] transition-all duration-700 ease-out"></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
