import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
// Note: Normally you need a service_role key to bypass RLS for inserts if it's secured, 
// but let's assume anon key works or RLS allows it for this project.
// If it fails, we will use a raw query or check the Supabase dashboard.
// The user already has data, so they must have inserted it somehow.

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding new topic...');
  const topicId = randomUUID();
  const lessonId = randomUUID();

  // 1. Insert Topic
  const { error: topicError } = await supabase.from('topics').insert({
    id: topicId,
    title: 'Giao tiếp hằng ngày (Test)',
    icon: '☕',
    level: 'HSK 2',
    order_index: 3,
  });
  if (topicError) {
    console.error('Error inserting topic:', topicError);
    return;
  }
  console.log('Topic inserted:', topicId);

  // 2. Insert Lesson
  const { error: lessonError } = await supabase.from('lessons').insert({
    id: lessonId,
    topic_id: topicId,
    title: 'Bài 1: Mua sắm siêu thị',
    order_index: 1,
  });
  if (lessonError) {
    console.error('Error inserting lesson:', lessonError);
    return;
  }
  console.log('Lesson inserted:', lessonId);

  // 3. Insert Dialogue Sentences (so they can go through the steps)
  await supabase.from('dialogue_sentences').insert([
    {
      id: randomUUID(),
      lesson_id: lessonId,
      order_index: 1,
      speaker: 'Nhân viên',
      chinese_text: '欢迎光临！您需要点什么？',
      pinyin: 'Huānyíng guānglín! Nín xūyào diǎn shénme?',
      vietnamese_text: 'Kính chào quý khách! Ngài cần chút gì không?',
      audio_url: null
    }
  ]);

  // 4. Insert Vocabulary
  await supabase.from('vocabulary').insert([
    {
      id: randomUUID(),
      lesson_id: lessonId,
      chinese_word: '超市',
      pinyin: 'chāoshì',
      meaning: 'Siêu thị',
      audio_url: null
    },
    {
      id: randomUUID(),
      lesson_id: lessonId,
      chinese_word: '买',
      pinyin: 'mǎi',
      meaning: 'Mua',
      audio_url: null
    }
  ]);

  // 5. Insert Pattern
  await supabase.from('sentence_patterns').insert([
    {
      id: randomUUID(),
      lesson_id: lessonId,
      chinese_text: '我要买...',
      pinyin: 'Wǒ yào mǎi...',
      vietnamese_text: 'Tôi muốn mua...',
      analysis: 'Dùng yào mǎi để diễn tả mong muốn mua một thứ gì đó.',
      parts: JSON.stringify([{ text: "我要", label: "Tôi muốn" }, { text: "买", label: "mua" }]),
      audio_url: null
    }
  ]);

  // 6. Insert Vocab Exercise
  await supabase.from('vocab_exercises').insert([
    {
      id: randomUUID(),
      lesson_id: lessonId,
      chinese_word: '超市',
      pinyin: 'chāoshì',
      correct_answer: 'Siêu thị',
      wrong_choices: JSON.stringify(['Chợ', 'Cửa hàng', 'Trường học'])
    }
  ]);

  // 7. Insert Sentence Exercise
  await supabase.from('sentence_exercises').insert([
    {
      id: randomUUID(),
      lesson_id: lessonId,
      prompt: 'Tôi muốn mua táo',
      pinyin: 'Wǒ yào mǎi píngguǒ',
      correct_sentence: '我要买苹果',
      scrambled_words: JSON.stringify(['我', '苹果', '要买'])
    }
  ]);

  console.log('Seeding complete!');
}

seed();
