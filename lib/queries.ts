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
  created_at: string;
}

export interface SentencePattern {
  id: string;
  lesson_id: string;
  chinese_text: string;
  pinyin: string;
  vietnamese_text: string;
  audio_url: string | null;
  created_at: string;
}

export interface LessonDetail {
  lesson: Lesson;
  dialogueSentences: DialogueSentence[];
  vocabulary: Vocabulary[];
  sentencePatterns: SentencePattern[];
}

export interface VocabExercise {
  id: string;
  lesson_id: string;
  sentence_with_blank: string;
  correct_word_id: string;
  wrong_choices: string[]; // parsed from jsonb
  created_at: string;
}

export interface SentenceExercise {
  id: string;
  lesson_id: string;
  correct_sentence: string;
  scrambled_words: string[]; // parsed from jsonb
  created_at: string;
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
