-- 1. Create tables
create table topics (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    icon text,
    level text,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table lessons (
    id uuid primary key default gen_random_uuid(),
    topic_id uuid references topics(id) on delete cascade not null,
    title text not null,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table dialogue_sentences (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid references lessons(id) on delete cascade not null,
    order_index integer not null default 0,
    chinese_text text not null,
    pinyin text not null,
    vietnamese_text text not null,
    audio_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table vocabulary (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid references lessons(id) on delete cascade not null,
    chinese_word text not null,
    pinyin text not null,
    meaning text not null,
    audio_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table sentence_patterns (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid references lessons(id) on delete cascade not null,
    chinese_text text not null,
    pinyin text not null,
    vietnamese_text text not null,
    audio_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table vocab_exercises (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid references lessons(id) on delete cascade not null,
    sentence_with_blank text not null,
    correct_word_id uuid references vocabulary(id) on delete cascade not null,
    wrong_choices jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table sentence_exercises (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid references lessons(id) on delete cascade not null,
    correct_sentence text not null,
    scrambled_words jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table user_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    lesson_id uuid references lessons(id) on delete cascade not null,
    status text not null check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, lesson_id) -- Một user chỉ có 1 record progress cho mỗi bài học
);


-- 2. Enable Row Level Security (RLS)
alter table topics enable row level security;
alter table lessons enable row level security;
alter table dialogue_sentences enable row level security;
alter table vocabulary enable row level security;
alter table sentence_patterns enable row level security;
alter table vocab_exercises enable row level security;
alter table sentence_exercises enable row level security;
alter table user_progress enable row level security;


-- 3. Create Policies

-- 3.1. Public Read policies cho các bảng nội dung bài học
-- Cho phép mọi người (kể cả chưa đăng nhập) có thể đọc nội dung bài học. 
-- Nhưng không có policy INSERT/UPDATE/DELETE, nghĩa là chỉ admin (service role hoặc dashboard) mới được thêm/sửa/xoá.
create policy "Allow public read access to topics" on topics for select using (true);
create policy "Allow public read access to lessons" on lessons for select using (true);
create policy "Allow public read access to dialogue_sentences" on dialogue_sentences for select using (true);
create policy "Allow public read access to vocabulary" on vocabulary for select using (true);
create policy "Allow public read access to sentence_patterns" on sentence_patterns for select using (true);
create policy "Allow public read access to vocab_exercises" on vocab_exercises for select using (true);
create policy "Allow public read access to sentence_exercises" on sentence_exercises for select using (true);

-- 3.2. Policies cho bảng user_progress
-- User đăng nhập chỉ được phép xem, thêm và sửa tiến trình của chính họ.
create policy "Users can view their own progress" 
on user_progress for select 
using ( auth.uid() = user_id );

create policy "Users can insert their own progress" 
on user_progress for insert 
with check ( auth.uid() = user_id );

create policy "Users can update their own progress" 
on user_progress for update 
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );


-- 4. Insert Sample Data
-- Dùng block DO $$ để tạo và gán ID ngẫu nhiên, đảm bảo liên kết được topic_id
DO $$
DECLARE
  v_topic_id uuid := gen_random_uuid();
  v_lesson_id uuid := gen_random_uuid();
BEGIN
  insert into topics (id, title, icon, level, order_index)
  values (v_topic_id, 'Gọi món ăn', '🍲', 'HSK 2', 1);

  insert into lessons (id, topic_id, title, order_index)
  values (v_lesson_id, v_topic_id, 'Tại nhà hàng', 1);
END $$;
