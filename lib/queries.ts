import { supabase } from './supabase';

// ==========================================
// Types
// ==========================================

export interface Topic {
  id: string;
  title: string;
  icon: string | null;
  level: string | null;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  topic_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface DialogueSentence {
  id: string;
  lesson_id: string;
  order_index: number;
  speaker: string | null;           // NEW: tên nhân vật
  chinese_text: string;
  pinyin: string;
  vietnamese_text: string;
  audio_url: string | null;
  created_at: string;
}

export interface Vocabulary {
  id: string;
  lesson_id: string;
  chinese_word: string;
  pinyin: string;
  meaning: string;
  audio_url: string | null;
  example_sentence: string | null;
  example_pinyin: string | null;
  example_meaning: string | null;
  created_at: string;
}

export interface SentencePattern {
  id: string;
  lesson_id: string;
  chinese_text: string;
  pinyin: string;
  vietnamese_text: string;
  audio_url: string | null;
  analysis: string | null;          // NEW: giải thích ngữ pháp
  parts: { text: string; label: string }[] | null;  // NEW: phân tích thành phần
  created_at: string;
}

export interface LessonDetail {
  lesson: Lesson;
  dialogueSentences: DialogueSentence[];
  vocabulary: Vocabulary[];
  sentencePatterns: SentencePattern[];
}

// Vocab exercise: đã đổi sang lưu trực tiếp text
export interface VocabExercise {
  id: string;
  lesson_id: string;
  chinese_word: string;             // CHANGED
  pinyin: string;                   // NEW
  correct_answer: string;           // CHANGED
  wrong_choices: string[];          // parsed from jsonb
  created_at: string;
}

export interface SentenceExercise {
  id: string;
  lesson_id: string;
  prompt: string;                   // NEW: câu gợi ý tiếng Việt
  pinyin: string;                   // NEW: pinyin đáp án
  correct_sentence: string;
  scrambled_words: string[];        // parsed from jsonb
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed';
  completed_at: string | null;
}

// ==========================================
// Queries
// ==========================================

export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Error fetching topics: ${error.message}`);
  }

  return data as Topic[];
}

export async function getAllLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*');

  if (error) {
    throw new Error(`Error fetching all lessons: ${error.message}`);
  }

  return data as Lesson[];
}

export async function getLessonsByTopic(topicId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Error fetching lessons for topic ${topicId}: ${error.message}`);
  }

  return data as Lesson[];
}

export async function getLessonDetail(lessonId: string): Promise<LessonDetail> {
  const [lessonRes, dialogueRes, vocabRes, patternsRes] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', lessonId).single(),
    supabase.from('dialogue_sentences').select('*').eq('lesson_id', lessonId).order('order_index', { ascending: true }),
    supabase.from('vocabulary').select('*').eq('lesson_id', lessonId),
    supabase.from('sentence_patterns').select('*').eq('lesson_id', lessonId)
  ]);

  if (lessonRes.error) throw new Error(`Error fetching lesson: ${lessonRes.error.message}`);
  if (dialogueRes.error) throw new Error(`Error fetching dialogue: ${dialogueRes.error.message}`);
  if (vocabRes.error) throw new Error(`Error fetching vocabulary: ${vocabRes.error.message}`);
  if (patternsRes.error) throw new Error(`Error fetching sentence patterns: ${patternsRes.error.message}`);

  return {
    lesson: lessonRes.data as Lesson,
    dialogueSentences: dialogueRes.data as DialogueSentence[],
    vocabulary: vocabRes.data as Vocabulary[],
    sentencePatterns: patternsRes.data as SentencePattern[]
  };
}

export async function getVocabExercises(lessonId: string): Promise<VocabExercise[]> {
  const { data, error } = await supabase
    .from('vocab_exercises')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error) {
    throw new Error(`Error fetching vocab exercises: ${error.message}`);
  }

  return data as VocabExercise[];
}

export async function getSentenceExercises(lessonId: string): Promise<SentenceExercise[]> {
  const { data, error } = await supabase
    .from('sentence_exercises')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error) {
    throw new Error(`Error fetching sentence exercises: ${error.message}`);
  }

  return data as SentenceExercise[];
}

export async function updateLessonProgress(lessonId: string, status: 'in_progress' | 'completed', userId: string) {
  // Check current status to avoid reverting 'completed' to 'in_progress'
  const { data: current } = await supabase
    .from('user_progress')
    .select('status')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (current?.status === 'completed' && status === 'in_progress') {
    return;
  }

  const payload: any = {
    user_id: userId,
    lesson_id: lessonId,
    status: status
  };

  if (status === 'completed') {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id, lesson_id' });

  if (error) {
    console.error('Error updating lesson progress:', error);
  }
}

export async function getUserProgressOverview(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }

  return data as UserProgress[];
}
