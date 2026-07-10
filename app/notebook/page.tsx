import AuthCheck from "@/components/AuthCheck";
import NotebookClient from "./NotebookClient";

export const metadata = {
  title: "Sổ tay - Chinese Learning App",
};

export default function NotebookPage() {
  return (
    <AuthCheck>
      <main className="flex flex-col pt-8 pb-20 px-6 max-w-4xl mx-auto">
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="text-5xl drop-shadow-md">📓</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#C1272D] mb-3">
            Sổ tay học tập
          </h1>
          <p className="text-[#5C5446] dark:text-white/70 text-lg max-w-lg mx-auto">
            Xem lại các ghi chú và câu trả lời hữu ích bạn đã lưu từ Trợ lý AI.
          </p>
        </div>

        <NotebookClient />
      </main>
    </AuthCheck>
  );
}
