"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email hoặc mật khẩu không đúng.");
        } else {
          setError(error.message);
        }
      } else {
        router.push("/topics");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] dark:bg-background flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="text-6xl drop-shadow-md">🏮</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#C1272D] mb-2">Đăng nhập</h2>
          <p className="text-[#7C7263] dark:text-white/60 font-medium text-sm">
            Học tiếng Trung dễ dàng với Easy Chinese
          </p>
        </div>

        <div className="bg-[#FFFDF8] dark:bg-white/5 p-8 rounded-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] border border-[#EFE4CE] dark:border-white/10 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {error && (
            <div className="mb-6 p-4 bg-[#C1272D]/10 text-[#A21E23] rounded-xl border border-[#C1272D]/20 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[13px] uppercase font-bold text-[#D4AF37] tracking-[1px] mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white dark:bg-black/20 border border-[#EFE4CE] dark:border-white/10 rounded-xl text-[#2B2622] dark:text-white font-medium focus:outline-none focus:border-[#C1272D] focus:ring-2 focus:ring-[#C1272D]/20 transition-all placeholder-[#B9AD98]"
                placeholder="Ví dụ: ban@example.com"
              />
            </div>

            <div>
              <label className="block text-[13px] uppercase font-bold text-[#D4AF37] tracking-[1px] mb-1.5 ml-1">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-white dark:bg-black/20 border border-[#EFE4CE] dark:border-white/10 rounded-xl text-[#2B2622] dark:text-white font-medium focus:outline-none focus:border-[#C1272D] focus:ring-2 focus:ring-[#C1272D]/20 transition-all placeholder-[#B9AD98]"
                placeholder="Nhập mật khẩu của bạn"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-[#C1272D] text-[#FFF6E4] font-bold text-[16px] rounded-xl shadow-[0_4px_12px_rgba(193,39,45,0.22)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(193,39,45,0.3)] transition-all"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập →"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-dashed border-[#EFE4CE] dark:border-white/10 pt-6">
            <p className="text-[14px] text-[#7C7263] dark:text-white/60 font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/signup" className="text-[#C1272D] font-bold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
