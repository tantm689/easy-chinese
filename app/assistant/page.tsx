import AssistantLayout from "@/components/AssistantLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trợ lý Ngữ pháp & Từ vựng - Easy Chinese",
  description: "Trợ lý ảo hỗ trợ giải đáp tiếng Trung HSK 1-3",
};

export default function AssistantPage() {
  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#FBF6EC] dark:bg-background flex flex-col items-center">
      <div className="w-full max-w-5xl h-full flex flex-col sm:p-4 md:p-6">
        <div className="flex-1 w-full h-full overflow-hidden sm:rounded-xl sm:border border-[#D4AF37]/40 sm:shadow-2xl">
          <AssistantLayout />
        </div>
      </div>
    </div>
  );
}
