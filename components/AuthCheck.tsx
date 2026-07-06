"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra session hiện tại
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    };

    checkUser();

    // Lắng nghe sự thay đổi của auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF6EC] dark:bg-background">
        <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Tránh flash nội dung trước khi redirect
  }

  return (
    <div className="min-h-screen bg-[#FBF6EC] dark:bg-background text-[#2B2622] dark:text-foreground">
      {/* Top Header cho các trang được bảo vệ */}
      <header className="fixed top-0 w-full bg-[#FFFDF8]/90 dark:bg-[#1A1814]/90 backdrop-blur-sm border-b border-[#EFE4CE] dark:border-white/10 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-[#C1272D] text-lg flex items-center gap-2">
            <span className="text-2xl drop-shadow-sm">🏮</span>
            Easy Chinese
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium text-[#7C7263] dark:text-white/60 hidden sm:inline-block">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-[13px] font-bold text-[#C1272D] px-3 py-1.5 rounded-lg hover:bg-[#C1272D]/10 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính sẽ được render ở đây */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
