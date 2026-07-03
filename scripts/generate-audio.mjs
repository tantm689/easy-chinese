/**
 * Script sinh audio TTS tiếng Trung bằng edge-tts (Microsoft Edge TTS API miễn phí)
 * 
 * CÁCH DÙNG:
 * 1. Cài Python 3.x (nếu chưa có)
 * 2. Cài edge-tts: pip install edge-tts
 * 3. Tạo file .env.local ở thư mục gốc dự án với:
 *    NEXT_PUBLIC_SUPABASE_URL=...
 *    SUPABASE_SERVICE_KEY=...   (service role key, KHÔNG phải anon key)
 * 4. Chạy: node scripts/generate-audio.mjs
 * 
 * Script sẽ:
 * - Lấy tất cả dialogue_sentences và vocabulary chưa có audio từ DB
 * - Sinh file MP3 cho mỗi câu/từ bằng edge-tts
 * - Upload lên Supabase Storage bucket "audio"
 * - Update audio_url trong DB
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'audio';
const VOICE_DEFAULT = 'zh-CN-XiaoxiaoNeural'; // Giọng nữ tự nhiên, rõ ràng
const RATE = '-10%'; // Chậm hơn 10% cho người mới học

// Map tên nhân vật với giọng đọc phù hợp
const SPEAKER_VOICES = {
  'Lý Minh': 'zh-CN-YunxiNeural',         // Giọng nam
  'Vương Phương': 'zh-CN-XiaoxiaoNeural', // Giọng nữ
  'Trương Hoa': 'zh-CN-XiaoyiNeural',     // Giọng nữ (có thể đổi thành giọng khác)
};

function getVoiceForSpeaker(speaker) {
  if (!speaker) return VOICE_DEFAULT;
  return SPEAKER_VOICES[speaker] || VOICE_DEFAULT;
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Thiếu biến môi trường!');
  console.error('   Cần: NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_KEY trong .env.local');
  console.error('   SUPABASE_SERVICE_KEY là service_role key (không phải anon key)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tạo thư mục tạm
const TMP_DIR = path.join(__dirname, '..', '.tmp-audio');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Kiểm tra edge-tts đã cài chưa
try {
  execSync('edge-tts --version', { stdio: 'pipe' });
  console.log('✅ edge-tts đã sẵn sàng');
} catch {
  console.error('❌ Chưa cài edge-tts! Chạy: pip install edge-tts');
  process.exit(1);
}

/**
 * Sinh file MP3 từ text tiếng Trung
 */
function generateTTS(text, voice, outputPath) {
  const cleanText = text.replace(/["""]/g, '').replace(/\n/g, ' ');
  const cmd = `edge-tts --voice "${voice}" --rate="${RATE}" --text "${cleanText}" --write-media "${outputPath}"`;
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    return true;
  } catch (err) {
    console.error(`   ⚠ Lỗi TTS cho "${text}":`, err.message);
    return false;
  }
}

/**
 * Upload file lên Supabase Storage và trả về public URL
 */
async function uploadToSupabase(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (error) {
    console.error(`   ⚠ Upload lỗi: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Xử lý một bảng: lấy records chưa có audio → sinh → upload → update
 */
async function processTable(tableName, textField, idField = 'id') {
  console.log(`\n📋 Đang xử lý bảng: ${tableName}`);
  
  let query = supabase.from(tableName).select('*');
  const isForce = process.argv.includes('--force');
  
  if (!isForce) {
    query = query.is('audio_url', null);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error(`   ❌ Lỗi query ${tableName}: ${error.message}`);
    return;
  }

  if (!records || records.length === 0) {
    console.log(`   ✅ Tất cả đã có audio!`);
    return;
  }

  console.log(`   📝 ${records.length} bản ghi cần sinh audio`);

  let success = 0;
  for (const record of records) {
    const text = record[textField];
    if (!text) continue;

    const timestamp = Date.now();
    const fileName = `${tableName}_${record[idField]}_${timestamp}.mp3`;
    const localPath = path.join(TMP_DIR, fileName);
    const storagePath = `${tableName}/${fileName}`;
    const voice = getVoiceForSpeaker(record.speaker);

    process.stdout.write(`   🎙 [${voice.replace('zh-CN-', '')}] "${text.substring(0, 30)}..." `);

    // Sinh TTS
    if (!generateTTS(text, voice, localPath)) continue;

    // Upload
    const publicUrl = await uploadToSupabase(localPath, storagePath);
    if (!publicUrl) continue;

    // Update DB
    const { error: updateErr } = await supabase
      .from(tableName)
      .update({ audio_url: publicUrl })
      .eq(idField, record[idField]);

    if (updateErr) {
      console.log('❌');
      console.error(`   Update lỗi: ${updateErr.message}`);
    } else {
      console.log('✅');
      success++;
    }

    // Xóa file tạm
    try { fs.unlinkSync(localPath); } catch {}
  }

  console.log(`   📊 Hoàn thành: ${success}/${records.length}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  const isForce = process.argv.includes('--force');
  console.log('🚀 BẮT ĐẦU SINH AUDIO TTS' + (isForce ? ' (CHẾ ĐỘ FORCE - TẠO LẠI TOÀN BỘ)' : ''));
  console.log(`   Rate: ${RATE}`);
  console.log(`   Bucket: ${BUCKET}`);

  // Tạo bucket nếu chưa có
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET);
  
  if (!bucketExists) {
    console.log(`\n📦 Tạo bucket "${BUCKET}"...`);
    const { error } = await supabase.storage.createBucket(BUCKET, { 
      public: true,
      fileSizeLimit: 5242880 // 5MB
    });
    if (error) {
      console.error(`   ❌ Lỗi tạo bucket: ${error.message}`);
      process.exit(1);
    }
    console.log(`   ✅ Bucket tạo thành công!`);
  } else {
    console.log(`\n📦 Bucket "${BUCKET}" đã tồn tại`);
  }

  // Sinh audio cho dialogue_sentences (text field: chinese_text)
  await processTable('dialogue_sentences', 'chinese_text');

  // Sinh audio cho vocabulary (text field: chinese_word)
  await processTable('vocabulary', 'chinese_word');

  // Sinh audio cho sentence_patterns (text field: chinese_text)
  await processTable('sentence_patterns', 'chinese_text');

  // Dọn thư mục tạm
  try { fs.rmSync(TMP_DIR, { recursive: true }); } catch {}

  console.log('\n🎉 HOÀN THÀNH!');
  console.log('   Tất cả audio đã được sinh và upload lên Supabase Storage.');
  console.log('   Kiểm tra trong Supabase Dashboard > Storage > audio');
}

main().catch(err => {
  console.error('💥 Lỗi không mong muốn:', err);
  process.exit(1);
});
