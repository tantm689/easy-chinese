-- ============================================
-- CHINESE LEARNING APP — COMPLETE DATABASE SETUP
-- DROP tất cả bảng cũ → tạo lại từ đầu
-- ============================================

-- 0. DROP tất cả (thứ tự ngược dependency)
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS sentence_exercises CASCADE;
DROP TABLE IF EXISTS vocab_exercises CASCADE;
DROP TABLE IF EXISTS sentence_patterns CASCADE;
DROP TABLE IF EXISTS vocabulary CASCADE;
DROP TABLE IF EXISTS dialogue_sentences CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS topics CASCADE;


-- ============================================
-- 1. CREATE TABLES
-- ============================================

CREATE TABLE topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    icon text,
    level text,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE dialogue_sentences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    speaker text,                     -- NEW: tên nhân vật (VD: "Lý Minh")
    chinese_text text NOT NULL,
    pinyin text NOT NULL,
    vietnamese_text text NOT NULL,
    audio_url text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE vocabulary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    chinese_word text NOT NULL,
    pinyin text NOT NULL,
    meaning text NOT NULL,
    audio_url text,
    example_sentence text,            -- NEW: câu ví dụ tiếng Trung
    example_pinyin text,              -- NEW: pinyin câu ví dụ
    example_meaning text,             -- NEW: nghĩa tiếng Việt câu ví dụ
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE sentence_patterns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    chinese_text text NOT NULL,
    pinyin text NOT NULL,
    vietnamese_text text NOT NULL,
    audio_url text,
    analysis text,                    -- NEW: giải thích ngữ pháp chi tiết
    parts jsonb,                      -- NEW: [{text, label}] phân tích thành phần
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Vocab exercises: đã đổi sang lưu trực tiếp text (không dùng FK)
CREATE TABLE vocab_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    chinese_word text NOT NULL,       -- CHANGED: từ cần hỏi
    pinyin text NOT NULL,             -- NEW: pinyin từ cần hỏi
    correct_answer text NOT NULL,     -- CHANGED: đáp án đúng (nghĩa TV)
    wrong_choices jsonb NOT NULL DEFAULT '[]'::jsonb,  -- 3 đáp án sai
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Sentence exercises: thêm prompt, pinyin, tokens
CREATE TABLE sentence_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    prompt text NOT NULL,             -- NEW: câu gợi ý tiếng Việt
    pinyin text NOT NULL,             -- NEW: pinyin đáp án
    correct_sentence text NOT NULL,
    scrambled_words jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    completed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, lesson_id)
);


-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 3. POLICIES
-- ============================================

-- Public read cho nội dung học
CREATE POLICY "Allow public read access to topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access to lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read access to dialogue_sentences" ON dialogue_sentences FOR SELECT USING (true);
CREATE POLICY "Allow public read access to vocabulary" ON vocabulary FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sentence_patterns" ON sentence_patterns FOR SELECT USING (true);
CREATE POLICY "Allow public read access to vocab_exercises" ON vocab_exercises FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sentence_exercises" ON sentence_exercises FOR SELECT USING (true);

-- User progress
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 4. SAMPLE DATA — 2 bài học hoàn chỉnh HSK 1
-- ============================================

DO $$
DECLARE
  -- IDs
  v_topic1 uuid := gen_random_uuid();
  v_lesson1 uuid := gen_random_uuid();
  v_lesson2 uuid := gen_random_uuid();
BEGIN

  -- ========================================
  -- TOPIC
  -- ========================================
  INSERT INTO topics (id, title, icon, level, order_index) VALUES
    (v_topic1, 'Chào hỏi & Giới thiệu', '👋', 'HSK 1', 1);


  -- ========================================
  -- LESSON 1: 很高兴认识你
  -- ========================================
  INSERT INTO lessons (id, topic_id, title, order_index) VALUES
    (v_lesson1, v_topic1, '很高兴认识你', 1);

  -- Dialogue (7 câu, 2 nhân vật: Lý Minh & Vương Phương)
  INSERT INTO dialogue_sentences (lesson_id, order_index, speaker, chinese_text, pinyin, vietnamese_text) VALUES
    (v_lesson1, 1, 'Lý Minh',     '你好！我叫李明。',           'Nǐ hǎo! Wǒ jiào Lǐ Míng.',                'Xin chào! Tôi tên là Lý Minh.'),
    (v_lesson1, 2, 'Vương Phương', '你好，李明。我是王芳。',     'Nǐ hǎo, Lǐ Míng. Wǒ shì Wáng Fāng.',     'Chào Lý Minh. Tôi là Vương Phương.'),
    (v_lesson1, 3, 'Lý Minh',     '很高兴认识你。',             'Hěn gāoxìng rènshi nǐ.',                   'Rất vui được làm quen với bạn.'),
    (v_lesson1, 4, 'Vương Phương', '我也很高兴认识你。',         'Wǒ yě hěn gāoxìng rènshi nǐ.',             'Tôi cũng rất vui được làm quen với bạn.'),
    (v_lesson1, 5, 'Lý Minh',     '你是哪国人？',               'Nǐ shì nǎ guó rén?',                       'Bạn là người nước nào?'),
    (v_lesson1, 6, 'Vương Phương', '我是中国人，你呢？',         'Wǒ shì Zhōngguó rén, nǐ ne?',              'Tôi là người Trung Quốc, còn bạn?'),
    (v_lesson1, 7, 'Lý Minh',     '我是越南人。',               'Wǒ shì Yuènán rén.',                        'Tôi là người Việt Nam.');

  -- Vocabulary (6 từ + câu ví dụ)
  INSERT INTO vocabulary (lesson_id, chinese_word, pinyin, meaning, example_sentence, example_pinyin, example_meaning) VALUES
    (v_lesson1, '认识', 'rènshi',       'làm quen, quen biết',   '很高兴认识你。',       'Hěn gāoxìng rènshi nǐ.',     'Rất vui được làm quen với bạn.'),
    (v_lesson1, '高兴', 'gāoxìng',      'vui, vui mừng',         '我今天很高兴。',       'Wǒ jīntiān hěn gāoxìng.',    'Hôm nay tôi rất vui.'),
    (v_lesson1, '叫',   'jiào',         'tên là, gọi là',        '我叫李明。',           'Wǒ jiào Lǐ Míng.',           'Tôi tên là Lý Minh.'),
    (v_lesson1, '是',   'shì',          'là',                    '我是越南人。',         'Wǒ shì Yuènán rén.',          'Tôi là người Việt Nam.'),
    (v_lesson1, '哪国人', 'nǎ guó rén', 'người nước nào',        '你是哪国人？',         'Nǐ shì nǎ guó rén?',         'Bạn là người nước nào?'),
    (v_lesson1, '中国', 'Zhōngguó',     'Trung Quốc',            '我是中国人。',         'Wǒ shì Zhōngguó rén.',       'Tôi là người Trung Quốc.');

  -- Sentence Patterns (3 mẫu câu + phân tích)
  INSERT INTO sentence_patterns (lesson_id, chinese_text, pinyin, vietnamese_text, analysis, parts) VALUES
    (v_lesson1,
     '很高兴',
     'hěn gāoxìng',
     'rất vui',
     '很 (rất) đứng trước tính từ để bổ nghĩa mức độ. Trong tiếng Trung, tính từ làm vị ngữ KHÔNG cần thêm 是 — nói thẳng "我很高兴" chứ không phải "我是高兴".',
     '[{"text":"很","label":"trạng từ mức độ"},{"text":"高兴","label":"tính từ"}]'::jsonb),
    (v_lesson1,
     '我是中国人',
     'Wǒ shì Zhōngguó rén',
     'Tôi là người Trung Quốc',
     'Cấu trúc Chủ ngữ + 是 + danh từ, dùng để giới thiệu thân phận, nghề nghiệp hay quốc tịch. 是 nối chủ ngữ với một danh từ (không dùng với tính từ).',
     '[{"text":"我","label":"chủ ngữ"},{"text":"是","label":"động từ"},{"text":"中国人","label":"danh từ"}]'::jsonb),
    (v_lesson1,
     '你呢？',
     'Nǐ ne?',
     'Còn bạn thì sao?',
     'Danh từ/đại từ + 呢 tạo câu hỏi rút gọn "còn... thì sao?", dùng để hỏi lại cùng một nội dung vừa nói mà không cần lặp lại cả câu.',
     '[{"text":"你","label":"chủ ngữ"},{"text":"呢","label":"trợ từ nghi vấn"}]'::jsonb);

  -- Vocab Exercises (6 câu trắc nghiệm)
  INSERT INTO vocab_exercises (lesson_id, chinese_word, pinyin, correct_answer, wrong_choices) VALUES
    (v_lesson1, '认识', 'rènshi',       'làm quen, quen biết', '["tạm biệt","cảm ơn","xin lỗi"]'::jsonb),
    (v_lesson1, '高兴', 'gāoxìng',      'vui, vui mừng',       '["mệt mỏi","bận rộn","buồn bã"]'::jsonb),
    (v_lesson1, '叫',   'jiào',         'tên là, gọi là',      '["ăn","đi","nhìn"]'::jsonb),
    (v_lesson1, '是',   'shì',          'là',                  '["có","không","và"]'::jsonb),
    (v_lesson1, '哪国人', 'nǎ guó rén', 'người nước nào',      '["ở đâu","khi nào","bao nhiêu"]'::jsonb),
    (v_lesson1, '中国', 'Zhōngguó',     'Trung Quốc',          '["Việt Nam","Hàn Quốc","Nhật Bản"]'::jsonb);

  -- Sentence Exercises (4 câu ghép)
  INSERT INTO sentence_exercises (lesson_id, prompt, pinyin, correct_sentence, scrambled_words) VALUES
    (v_lesson1, 'Tôi tên là Lý Minh.',
     'Wǒ jiào Lǐ Míng.',
     '我叫李明。',
     '["叫","我","李明"]'::jsonb),
    (v_lesson1, 'Rất vui được làm quen với bạn.',
     'Hěn gāoxìng rènshi nǐ.',
     '很高兴认识你。',
     '["认识","很","你","高兴"]'::jsonb),
    (v_lesson1, 'Tôi là người Việt Nam.',
     'Wǒ shì Yuènán rén.',
     '我是越南人。',
     '["越南人","是","我"]'::jsonb),
    (v_lesson1, 'Bạn là người nước nào?',
     'Nǐ shì nǎ guó rén?',
     '你是哪国人？',
     '["哪国人","你","是"]'::jsonb);


  -- ========================================
  -- LESSON 2: 你家有几口人？
  -- ========================================
  INSERT INTO lessons (id, topic_id, title, order_index) VALUES
    (v_lesson2, v_topic1, '你家有几口人？', 2);

  -- Dialogue (6 câu, 2 nhân vật: Lý Minh & Trương Hoa)
  INSERT INTO dialogue_sentences (lesson_id, order_index, speaker, chinese_text, pinyin, vietnamese_text) VALUES
    (v_lesson2, 1, 'Trương Hoa', '李明，你家有几口人？',       'Lǐ Míng, nǐ jiā yǒu jǐ kǒu rén?',    'Lý Minh, gia đình bạn có mấy người?'),
    (v_lesson2, 2, 'Lý Minh',   '我家有四口人。',             'Wǒ jiā yǒu sì kǒu rén.',              'Gia đình tôi có bốn người.'),
    (v_lesson2, 3, 'Trương Hoa', '都有谁？',                   'Dōu yǒu shéi?',                        'Gồm những ai?'),
    (v_lesson2, 4, 'Lý Minh',   '爸爸、妈妈、弟弟和我。',     'Bàba, māma, dìdi hé wǒ.',              'Bố, mẹ, em trai và tôi.'),
    (v_lesson2, 5, 'Trương Hoa', '你弟弟几岁了？',             'Nǐ dìdi jǐ suì le?',                   'Em trai bạn mấy tuổi rồi?'),
    (v_lesson2, 6, 'Lý Minh',   '他今年十岁。',               'Tā jīnnián shí suì.',                   'Năm nay em ấy mười tuổi.');

  -- Vocabulary (6 từ + câu ví dụ)
  INSERT INTO vocabulary (lesson_id, chinese_word, pinyin, meaning, example_sentence, example_pinyin, example_meaning) VALUES
    (v_lesson2, '家',   'jiā',    'nhà, gia đình',             '我家有四口人。',       'Wǒ jiā yǒu sì kǒu rén.',    'Gia đình tôi có bốn người.'),
    (v_lesson2, '几',   'jǐ',     'mấy, bao nhiêu (≤10)',      '你家有几口人？',       'Nǐ jiā yǒu jǐ kǒu rén?',    'Gia đình bạn có mấy người?'),
    (v_lesson2, '口',   'kǒu',    'miệng; lượng từ (người)',   '三口人。',             'Sān kǒu rén.',                'Ba người.'),
    (v_lesson2, '爸爸', 'bàba',   'bố, ba',                    '我爸爸是老师。',       'Wǒ bàba shì lǎoshī.',        'Bố tôi là giáo viên.'),
    (v_lesson2, '妈妈', 'māma',   'mẹ, má',                    '妈妈做饭很好吃。',     'Māma zuò fàn hěn hǎochī.',   'Mẹ nấu ăn rất ngon.'),
    (v_lesson2, '弟弟', 'dìdi',   'em trai',                   '我有一个弟弟。',       'Wǒ yǒu yí ge dìdi.',         'Tôi có một em trai.');

  -- Sentence Patterns (3 mẫu câu + phân tích)
  INSERT INTO sentence_patterns (lesson_id, chinese_text, pinyin, vietnamese_text, analysis, parts) VALUES
    (v_lesson2,
     '我家有四口人',
     'Wǒ jiā yǒu sì kǒu rén',
     'Gia đình tôi có bốn người',
     'Cấu trúc Chủ ngữ + 有 + số lượng + lượng từ + danh từ. 有 (yǒu) nghĩa là "có", dùng để nói về sở hữu hoặc tồn tại. 口 là lượng từ dùng riêng cho thành viên gia đình.',
     '[{"text":"我家","label":"chủ ngữ"},{"text":"有","label":"động từ (có)"},{"text":"四口","label":"số + lượng từ"},{"text":"人","label":"danh từ"}]'::jsonb),
    (v_lesson2,
     '你弟弟几岁了？',
     'Nǐ dìdi jǐ suì le?',
     'Em trai bạn mấy tuổi rồi?',
     'Cấu trúc hỏi tuổi: S + 几岁 + 了？ 几 dùng khi dự đoán câu trả lời là số nhỏ (dưới 10). 了 ở cuối câu biểu thị sự thay đổi trạng thái (đã lớn lên).',
     '[{"text":"你弟弟","label":"chủ ngữ"},{"text":"几岁","label":"mấy tuổi"},{"text":"了","label":"trợ từ thay đổi"}]'::jsonb),
    (v_lesson2,
     '他今年十岁',
     'Tā jīnnián shí suì',
     'Năm nay em ấy mười tuổi',
     'Cấu trúc nói tuổi: S + 今年 + số + 岁. 今年 (jīnnián) = năm nay, dùng làm trạng từ thời gian đặt trước vị ngữ. Không cần 是 trước số tuổi.',
     '[{"text":"他","label":"chủ ngữ"},{"text":"今年","label":"trạng từ thời gian"},{"text":"十岁","label":"vị ngữ (tuổi)"}]'::jsonb);

  -- Vocab Exercises (6 câu trắc nghiệm)
  INSERT INTO vocab_exercises (lesson_id, chinese_word, pinyin, correct_answer, wrong_choices) VALUES
    (v_lesson2, '家',   'jiā',   'nhà, gia đình',             '["trường học","công ty","bệnh viện"]'::jsonb),
    (v_lesson2, '几',   'jǐ',    'mấy, bao nhiêu (≤10)',      '["nhiều","ít","tất cả"]'::jsonb),
    (v_lesson2, '口',   'kǒu',   'miệng; lượng từ (người)',   '["mắt","tai","mũi"]'::jsonb),
    (v_lesson2, '爸爸', 'bàba',  'bố, ba',                    '["anh trai","chú","ông"]'::jsonb),
    (v_lesson2, '妈妈', 'māma',  'mẹ, má',                    '["chị gái","dì","bà"]'::jsonb),
    (v_lesson2, '弟弟', 'dìdi',  'em trai',                   '["em gái","anh trai","chị gái"]'::jsonb);

  -- Sentence Exercises (4 câu ghép)
  INSERT INTO sentence_exercises (lesson_id, prompt, pinyin, correct_sentence, scrambled_words) VALUES
    (v_lesson2, 'Gia đình tôi có bốn người.',
     'Wǒ jiā yǒu sì kǒu rén.',
     '我家有四口人。',
     '["有","我家","人","四口"]'::jsonb),
    (v_lesson2, 'Em trai bạn mấy tuổi rồi?',
     'Nǐ dìdi jǐ suì le?',
     '你弟弟几岁了？',
     '["几岁","你","了","弟弟"]'::jsonb),
    (v_lesson2, 'Năm nay em ấy mười tuổi.',
     'Tā jīnnián shí suì.',
     '他今年十岁。',
     '["十岁","今年","他"]'::jsonb),
    (v_lesson2, 'Bố, mẹ, em trai và tôi.',
     'Bàba, māma, dìdi hé wǒ.',
     '爸爸、妈妈、弟弟和我。',
     '["和","妈妈","我","爸爸","弟弟"]'::jsonb);

END $$;
