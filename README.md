# Chinese Learning App

Ứng dụng học tiếng Trung xây dựng trên **Next.js 15 + Tailwind CSS + Supabase**.

---

## 🚀 Cách chạy project

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình Supabase

Mở file `.env.local` và điền thông tin từ dashboard Supabase của bạn:
- Vào [supabase.com](https://supabase.com) → Project → **Settings** → **API**
- Copy **Project URL** và **anon/public key**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

---

## 📁 Cấu trúc thư mục

```
chinese-learning-app/
├── app/                  # Next.js App Router (pages, layouts)
│   ├── layout.tsx
│   └── page.tsx
├── components/           # Reusable React components
├── lib/
│   └── supabase.ts       # Supabase client
├── public/               # Static assets
├── .env.local            # Environment variables (KHÔNG commit file này)
└── README.md
```

---

## 🛠 Tech Stack

| Công nghệ | Phiên bản |
|-----------|-----------|
| Next.js   | 15 (App Router) |
| React     | 19 |
| Tailwind CSS | 4 |
| Supabase  | Latest |
| TypeScript | 5 |

---

## 📝 Ghi chú

- File `.env.local` đã được thêm vào `.gitignore` — **KHÔNG** commit file này lên Git.
- Supabase client được khởi tạo tại `lib/supabase.ts` và có thể import ở bất kỳ đâu.
