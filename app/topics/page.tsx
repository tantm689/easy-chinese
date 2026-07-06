import Link from "next/link";
import { getTopics, getAllLessons } from "@/lib/queries";
import AuthCheck from "@/components/AuthCheck";
import TopicsListClient from "./TopicsListClient";

export const metadata = {
  title: "Chủ đề học - Chinese Learning App",
};

export default async function TopicsPage() {
  const topics = await getTopics();
  const lessons = await getAllLessons();

  return (
    <AuthCheck>
      <main className="flex flex-col pt-8 pb-20 px-6 max-w-4xl mx-auto">
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

        <TopicsListClient topics={topics} lessons={lessons} />
      </main>
    </AuthCheck>
  );
}
