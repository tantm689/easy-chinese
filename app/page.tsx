"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/topics");
      } else {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF6EC] dark:bg-background">
        <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EC] dark:bg-background text-[#2B2622] dark:text-foreground flex flex-col">
      {/* Public Header */}
      <header className="w-full bg-[#FFFDF8]/90 dark:bg-[#1A1814]/90 backdrop-blur-sm border-b border-[#EFE4CE] dark:border-white/10 z-50 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-[#C1272D] text-lg flex items-center gap-2">
            <span className="text-2xl drop-shadow-sm">🏮</span>
            Easy Chinese
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[13px] font-bold text-[#7C7263] dark:text-white/60 hover:text-[#C1272D] transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-bold bg-[#C1272D] text-[#FFF6E4] px-4 py-2 rounded-lg hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(193,39,45,0.22)] transition-all"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-7xl md:text-8xl drop-shadow-xl animate-bounce">🏮</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#C1272D] mb-6">
            Easy Chinese
          </h1>
          
          <p className="text-lg md:text-xl text-[#7C7263] dark:text-white/60 font-medium mb-12 max-w-2xl mx-auto">
            Khám phá phương pháp học tiếng Trung hiệu quả qua các tình huống thực tế. 
            Phát triển toàn diện kỹ năng với các công cụ học tập thông minh.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
            <div className="bg-[#FFFDF8] dark:bg-white/5 p-6 rounded-2xl shadow-[0_10px_30px_rgba(120,90,40,0.04)] border border-[#EFE4CE] dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="font-bold text-[#D4AF37] mb-2 text-lg">Thư viện tình huống</h3>
              <p className="text-[14px] text-[#7C7263] dark:text-white/60 leading-relaxed">
                Học từ vựng và mẫu câu giao tiếp trực quan qua các ngữ cảnh đời sống phong phú.
              </p>
            </div>
            
            <div className="bg-[#FFFDF8] dark:bg-white/5 p-6 rounded-2xl shadow-[0_10px_30px_rgba(120,90,40,0.04)] border border-[#EFE4CE] dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="font-bold text-[#D4AF37] mb-2 text-lg">Luyện Shadowing</h3>
              <p className="text-[14px] text-[#7C7263] dark:text-white/60 leading-relaxed">
                Rèn luyện phát âm và ngữ điệu tự nhiên, chuẩn xác như người bản xứ.
              </p>
            </div>
            
            <div className="bg-[#FFFDF8] dark:bg-white/5 p-6 rounded-2xl shadow-[0_10px_30px_rgba(120,90,40,0.04)] border border-[#EFE4CE] dark:border-white/10 hover:-translate-y-1 transition-transform">
              <div className="text-3xl mb-4">🔁</div>
              <h3 className="font-bold text-[#D4AF37] mb-2 text-lg">Dịch ngược & Flashcard</h3>
              <p className="text-[14px] text-[#7C7263] dark:text-white/60 leading-relaxed">
                Củng cố và ghi nhớ dài hạn từ vựng, ngữ pháp một cách chủ động và hiệu quả.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-[#C1272D] text-[#FFF6E4] font-bold text-[16px] rounded-xl shadow-[0_4px_12px_rgba(193,39,45,0.22)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(193,39,45,0.3)] transition-all w-full sm:w-auto"
            >
              Bắt đầu học ngay →
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-bold text-[16px] rounded-xl hover:bg-[#D4AF37]/10 transition-all w-full sm:w-auto"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
