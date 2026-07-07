"use client";

import { supabase } from './supabase';
import { Topic, Lesson, UserProgress } from './queries';

// ==========================================
// Types
// ==========================================

export interface UserStats {
  user_id: string;
  avatar: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  updated_at: string;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
}

// ==========================================
// Streak Logic
// ==========================================

function getToday(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Check and update streak for a user. Called once per day per session.
 * Uses sessionStorage to avoid repeated calls within the same browser session.
 */
export async function checkAndUpdateStreak(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Guard: only run once per day per session
  const guardKey = `streak_checked_${userId}`;
  const alreadyChecked = sessionStorage.getItem(guardKey);
  if (alreadyChecked === getToday()) return;

  const { data: stats, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const today = getToday();
  const yesterday = getYesterday();

  if (error || !stats) {
    // No row yet → create new
    await supabase.from('user_stats').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    });
  } else if (stats.last_study_date === today) {
    // Already counted today → do nothing
  } else if (stats.last_study_date === yesterday) {
    // Consecutive day
    const newStreak = stats.current_streak + 1;
    const newLongest = Math.max(newStreak, stats.longest_streak);
    await supabase.from('user_stats').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } else {
    // Gap > 1 day → reset streak
    await supabase.from('user_stats').update({
      current_streak: 1,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  }

  // Mark as checked for this session+day
  sessionStorage.setItem(guardKey, today);
}

// ==========================================
// User Stats Fetch
// ==========================================

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as UserStats;
}

export async function updateAvatar(userId: string, avatar: string): Promise<void> {
  await supabase.from('user_stats').update({
    avatar,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
}

// ==========================================
// Level (computed dynamically)
// ==========================================

export function computeLevel(
  progress: UserProgress[],
  lessons: Lesson[],
  topics: Topic[]
): string {
  // Find all lesson_ids where status != 'not_started'
  const activeLessonIds = new Set(progress.map(p => p.lesson_id));
  if (activeLessonIds.size === 0) return 'Mới bắt đầu';

  // Map lesson_id → topic_id
  const lessonToTopic = new Map<string, string>();
  lessons.forEach(l => lessonToTopic.set(l.id, l.topic_id));

  // Map topic_id → level
  const topicToLevel = new Map<string, string>();
  topics.forEach(t => topicToLevel.set(t.id, t.level || ''));

  // Find highest level
  let maxLevel = 0;
  activeLessonIds.forEach(lessonId => {
    const topicId = lessonToTopic.get(lessonId);
    if (!topicId) return;
    const level = topicToLevel.get(topicId) || '';
    const match = level.match(/HSK\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxLevel) maxLevel = num;
    }
  });

  if (maxLevel === 0) return 'Mới bắt đầu';
  return `Đang học HSK ${maxLevel}`;
}

// ==========================================
// Badges (computed dynamically)
// ==========================================

export function computeBadges(
  progress: UserProgress[],
  lessons: Lesson[],
  topics: Topic[],
  stats: UserStats | null
): Badge[] {
  const completedLessonIds = new Set(
    progress.filter(p => p.status === 'completed').map(p => p.lesson_id)
  );

  // Map lesson → topic
  const lessonToTopic = new Map<string, string>();
  lessons.forEach(l => lessonToTopic.set(l.id, l.topic_id));

  // Map topic → level
  const topicToLevel = new Map<string, string>();
  topics.forEach(t => topicToLevel.set(t.id, t.level || ''));

  // Group lessons by topic
  const topicLessons = new Map<string, string[]>();
  lessons.forEach(l => {
    const list = topicLessons.get(l.topic_id) || [];
    list.push(l.id);
    topicLessons.set(l.topic_id, list);
  });

  // 1. Bước đầu tiên: ít nhất 1 lesson completed
  const hasFirstStep = completedLessonIds.size >= 1;

  // 2. Chinh phục chủ đề: 1 topic ALL lessons completed
  const completedTopics: string[] = [];
  topicLessons.forEach((lessonIds, topicId) => {
    if (lessonIds.length > 0 && lessonIds.every(id => completedLessonIds.has(id))) {
      completedTopics.push(topicId);
    }
  });
  const hasConqueredTopic = completedTopics.length >= 1;

  // 3. Vượt qua HSK1: all lessons in all HSK1 topics completed
  const hsk1Topics = topics.filter(t => t.level === 'HSK 1');
  const hsk1AllCompleted = hsk1Topics.length > 0 && hsk1Topics.every(topic => {
    const lessonIds = topicLessons.get(topic.id) || [];
    return lessonIds.length > 0 && lessonIds.every(id => completedLessonIds.has(id));
  });

  // 4. Ba chủ đề: >= 3 topics all completed
  const hasThreeTopics = completedTopics.length >= 3;

  // 5. Kiên trì 7 ngày
  const has7DayStreak = stats
    ? (stats.current_streak >= 7 || stats.longest_streak >= 7)
    : false;

  return [
    {
      id: 'first_step',
      icon: '🌱',
      name: 'Bước đầu tiên',
      description: 'Hoàn thành ít nhất 1 bài học',
      unlocked: hasFirstStep,
    },
    {
      id: 'conquer_topic',
      icon: '🎯',
      name: 'Chinh phục chủ đề',
      description: 'Hoàn thành tất cả bài học trong 1 chủ đề',
      unlocked: hasConqueredTopic,
    },
    {
      id: 'hsk1_master',
      icon: '🏆',
      name: 'Vượt qua HSK 1',
      description: 'Hoàn thành mọi bài học thuộc HSK 1',
      unlocked: hsk1AllCompleted,
    },
    {
      id: 'three_topics',
      icon: '📚',
      name: 'Ba chủ đề',
      description: 'Chinh phục từ 3 chủ đề trở lên',
      unlocked: hasThreeTopics,
    },
    {
      id: 'streak_7',
      icon: '🔥',
      name: 'Kiên trì 7 ngày',
      description: 'Duy trì chuỗi đăng nhập 7 ngày liên tục',
      unlocked: has7DayStreak,
    },
  ];
}

// ==========================================
// Avatar Helpers
// ==========================================

export const AVATAR_OPTIONS = ['🐼', '🐯', '🐰', '🦊', '🐨', '🦁', '🐸', '🐧'];

export function getAvatarEmoji(avatarKey: string): string {
  const map: Record<string, string> = {
    panda: '🐼',
    tiger: '🐯',
    rabbit: '🐰',
    fox: '🦊',
    koala: '🐨',
    lion: '🦁',
    frog: '🐸',
    penguin: '🐧',
  };
  return map[avatarKey] || '🐼';
}

export function getAvatarKey(emoji: string): string {
  const map: Record<string, string> = {
    '🐼': 'panda',
    '🐯': 'tiger',
    '🐰': 'rabbit',
    '🦊': 'fox',
    '🐨': 'koala',
    '🦁': 'lion',
    '🐸': 'frog',
    '🐧': 'penguin',
  };
  return map[emoji] || 'panda';
}
