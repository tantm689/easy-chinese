"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTopics, getAllLessons, getUserProgressOverview } from "@/lib/queries";
import type { Topic, Lesson, UserProgress } from "@/lib/queries";
import {
  getUserStats,
  updateAvatar,
  computeLevel,
  computeBadges,
  getAvatarEmoji,
  getAvatarKey,
  AVATAR_OPTIONS,
  type UserStats,
  type Badge,
} from "@/lib/userStats";

export default function ProfileClient() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [level, setLevel] = useState("Mới bắt đầu");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const [userStats, userProgress, allTopics, allLessons] = await Promise.all([
        getUserStats(userId),
        getUserProgressOverview(userId),
        getTopics(),
        getAllLessons(),
      ]);

      setStats(userStats);
      setProgress(userProgress);
      setTopics(allTopics);
      setLessons(allLessons);
      setLevel(computeLevel(userProgress, allLessons, allTopics));
      setBadges(computeBadges(userProgress, allLessons, allTopics, userStats));
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleAvatarSelect = async (emoji: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const key = getAvatarKey(emoji);
    await updateAvatar(session.user.id, key);
    setStats(prev => prev ? { ...prev, avatar: key } : null);
    setShowAvatarModal(false);
    // Force reload to update navbar avatar too
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentAvatar = stats ? getAvatarEmoji(stats.avatar) : "🐼";
  const streak = stats?.current_streak || 0;

  return (
    <main className="flex flex-col items-center pt-8 pb-20 px-6 max-w-2xl mx-auto animate-fade-in">
      {/* Avatar Section */}
      <div className="relative mb-6">
        <button
          onClick={() => setShowAvatarModal(true)}
          className="group relative w-28 h-28 bg-white dark:bg-[#25221c] rounded-[2rem] border-2 border-[#EFE4CE] dark:border-white/10 flex items-center justify-center shadow-lg hover:shadow-xl hover:border-[#C1272D]/30 transition-all hover:-translate-y-1"
        >
          <span className="text-6xl">{currentAvatar}</span>
          <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#C1272D] rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </button>
      </div>

      {/* Level Badge */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#C1272D]/10 to-[#D4AF37]/10 rounded-full text-sm font-bold text-[#C1272D] border border-[#C1272D]/15">
          📖 {level}
        </span>
      </div>

      {/* Streak */}
      <div className="mb-10">
        <span className="text-lg font-bold text-[#D4AF37] flex items-center gap-1.5">
          🔥 {streak} ngày liên tục
        </span>
      </div>

      {/* Badges Section */}
      <div className="w-full">
        <h2 className="text-xl font-bold text-[#5C5446] dark:text-white/80 mb-6 text-center">
          🏅 Huy hiệu
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`group relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all ${
                badge.unlocked
                  ? 'bg-white dark:bg-[#25221c] border-[#D4AF37]/30 shadow-sm hover:shadow-md hover:-translate-y-1'
                  : 'bg-[#F5F0E8] dark:bg-[#1A1814] border-transparent opacity-60'
              }`}
            >
              <div className="relative mb-3">
                <span className={`text-4xl ${badge.unlocked ? '' : 'grayscale'}`}>
                  {badge.icon}
                </span>
                {!badge.unlocked && (
                  <span className="absolute -bottom-1 -right-1 text-lg">🔒</span>
                )}
              </div>
              <span className={`text-sm font-bold text-center ${
                badge.unlocked ? 'text-[#5C5446] dark:text-white/80' : 'text-[#A89C88] dark:text-white/40'
              }`}>
                {badge.name}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2B2622] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                {badge.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2B2622]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white dark:bg-[#25221c] rounded-3xl p-8 mx-6 max-w-sm w-full shadow-2xl border border-[#EFE4CE] dark:border-white/10">
            <h3 className="text-xl font-bold text-center text-[#5C5446] dark:text-white/80 mb-6">
              Chọn avatar của bạn
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAvatarSelect(emoji)}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all hover:scale-110 hover:shadow-md ${
                    currentAvatar === emoji
                      ? 'border-[#C1272D] bg-[#C1272D]/5 shadow-sm'
                      : 'border-[#EFE4CE] dark:border-white/10 hover:border-[#D4AF37]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarModal(false)}
              className="w-full py-3 rounded-xl text-sm font-bold text-[#7C7263] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
