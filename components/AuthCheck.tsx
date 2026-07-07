"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { checkAndUpdateStreak, getUserStats, getAvatarEmoji } from "@/lib/userStats";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarEmoji, setAvatarEmoji] = useState("🐼");

  useEffect(() => {
    // Kiểm tra session hiện tại
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        // Update streak (runs only once per day per session)
        await checkAndUpdateStreak(session.user.id);
        // Fetch avatar for navbar
        const stats = await getUserStats(session.user.id);
        if (stats) setAvatarEmoji(getAvatarEmoji(stats.avatar));
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

  const displayName = user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[#FBF6EC] dark:bg-background text-[#2B2622] dark:text-foreground">
      {/* Top Header cho các trang được bảo vệ */}
      <header className="fixed top-0 w-full bg-[#FFFDF8]/90 dark:bg-[#1A1814]/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/topics" className="font-serif font-bold text-[#C1272D] text-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl drop-shadow-sm">🏮</span>
            Easy Chinese
          </Link>
          
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-[#C1272D]/5 ${
                pathname === '/profile' ? 'bg-[#C1272D]/10' : ''
              }`}
            >
              <span className="text-xl">{avatarEmoji}</span>
              <span className="text-[13px] font-semibold text-[#5C5446] dark:text-white/70 hidden sm:inline-block max-w-[100px] truncate">
                {displayName}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[13px] font-bold text-[#C1272D] px-3 py-1.5 rounded-lg hover:bg-[#C1272D]/10 transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Đăng xuất</span>
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
