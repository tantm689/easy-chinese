"use client";

import { useState, useEffect, useRef } from "react";
import { DialogueSentence } from "@/lib/queries";

const avatarColors = [
  { bg: "#C1272D", text: "#FFF3DC" },
  { bg: "#D4AF37", text: "#4A3B12" },
  { bg: "#2E5B53", text: "#E3F0ED" },
  { bg: "#8C4A5A", text: "#FCE8ED" },
];

export default function DialogueClient({
  sentences,
}: {
  sentences: DialogueSentence[];
}) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toggles for UI
  const [showChinese, setShowChinese] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);

  // Xử lý auto-play toàn bài
  useEffect(() => {
    if (playingIndex !== null) {
      const url = sentences[playingIndex]?.audio_url;
      if (url) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(e => console.log("Audio play failed", e));
        
        audio.onended = () => {
          if (isAutoPlaying) {
            // Chuyển câu tiếp theo nếu đang nghe toàn bài
            if (playingIndex + 1 < sentences.length) {
              setPlayingIndex(playingIndex + 1);
            } else {
              // Hết bài
              setIsAutoPlaying(false);
              setPlayingIndex(null);
            }
          } else {
            // Nghe lẻ từng câu thì dừng
            setPlayingIndex(null);
          }
        };
      } else {
        // Câu này không có audio, bỏ qua hoặc chuyển tiếp
        if (isAutoPlaying) {
           if (playingIndex + 1 < sentences.length) {
              setPlayingIndex(playingIndex + 1);
           } else {
              setIsAutoPlaying(false);
              setPlayingIndex(null);
           }
        } else {
           setPlayingIndex(null);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
      }
    };
  }, [playingIndex, isAutoPlaying, sentences]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setPlayingIndex(null);
    } else {
      setIsAutoPlaying(true);
      setPlayingIndex(0); // Bắt đầu từ câu đầu tiên
    }
  };

  const playIndividual = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (playingIndex === index) {
      // Bấm lại câu đang nghe -> Dừng
      setPlayingIndex(null);
      setIsAutoPlaying(false);
    } else {
      // Nghe câu mới
      setIsAutoPlaying(false);
      setPlayingIndex(index);
    }
  };

  // Tự động gán màu cho mỗi speaker dựa trên thứ tự xuất hiện
  const speakersMap = new Map<string, { bg: string; text: string }>();
  let colorIdx = 0;
  const getSpeakerStyle = (speaker: string) => {
    if (!speakersMap.has(speaker)) {
      speakersMap.set(speaker, avatarColors[colorIdx % avatarColors.length]);
      colorIdx++;
    }
    return speakersMap.get(speaker)!;
  };

  return (
    <div className="flex flex-col">
      {/* Thanh điều khiển */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#FFFDF8] dark:bg-white/5 rounded-2xl p-4 shadow-[0_4px_16px_rgba(120,90,40,0.05)] border border-[#EFE4CE] dark:border-white/10 animate-fade-in-up">
        
        <button 
          onClick={toggleAutoPlay} 
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C1272D] text-[#FFF6E4] rounded-xl font-bold text-[15px] shadow-[0_4px_12px_rgba(193,39,45,0.22)] transition-all hover:scale-105 active:scale-95"
        >
          {isAutoPlaying ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              Dừng phát
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 16 18" fill="currentColor"><path d="M2 1.5c0-.9 1-1.5 1.8-1L14 6.5c.8.5.8 1.7 0 2.2L3.8 15c-.8.5-1.8-.1-1.8-1V1.5z" transform="translate(0 .5)"/></svg>
              Nghe toàn bài
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[14px] font-semibold text-[#8A8071] dark:text-white/60">
          <label className="flex items-center gap-2 cursor-pointer transition-colors hover:text-[#C1272D]">
            <input 
              type="checkbox" 
              checked={showChinese} 
              onChange={e => setShowChinese(e.target.checked)} 
              className="accent-[#C1272D] w-4 h-4 cursor-pointer" 
            />
            Chữ Hán
          </label>
          <label className="flex items-center gap-2 cursor-pointer transition-colors hover:text-[#C1272D]">
            <input 
              type="checkbox" 
              checked={showPinyin} 
              onChange={e => setShowPinyin(e.target.checked)} 
              className="accent-[#C1272D] w-4 h-4 cursor-pointer" 
            />
            Pinyin
          </label>
          <label className="flex items-center gap-2 cursor-pointer transition-colors hover:text-[#C1272D]">
            <input 
              type="checkbox" 
              checked={showMeaning} 
              onChange={e => setShowMeaning(e.target.checked)} 
              className="accent-[#C1272D] w-4 h-4 cursor-pointer" 
            />
            Nghĩa
          </label>
        </div>
      </div>

      {/* Danh sách bài khóa */}
      <div className="flex flex-col gap-[14px]">
        {sentences.map((sentence, idx) => {
          const speakerName = sentence.speaker || "A";
          const initial = speakerName.charAt(0).toUpperCase();
          const style = getSpeakerStyle(speakerName);
          const isPlaying = playingIndex === idx;

          return (
            <div key={sentence.id} className="flex gap-[13px] items-start animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
              {/* Avatar */}
              <div 
                className="shrink-0 w-[38px] h-[38px] rounded-[13px] flex items-center justify-center font-extrabold text-[15px] mt-1 shadow-sm transition-transform duration-300"
                style={{ 
                  backgroundColor: style.bg, 
                  color: style.text,
                  transform: isPlaying ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {initial}
              </div>

              {/* Bubble */}
              <div 
                className="flex-1 bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 border rounded-[20px] rounded-tl-[6px] px-[18px] py-[16px] shadow-[0_4px_16px_rgba(120,90,40,0.05)] dark:shadow-none transition-all duration-300"
                style={{
                  borderColor: isPlaying ? '#C1272D' : 'rgba(239, 228, 206, 1)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Hiệu ứng làm mờ khi bị ẩn thay vì xoá hẳn, giúp UI không bị giật và có thể hover xem lén */}
                    <div className={`text-[13px] text-[#B9AD98] dark:text-white/40 font-semibold tracking-[0.3px] mb-[3px] transition-all duration-300 ${!showPinyin ? 'blur-sm opacity-30 hover:blur-none hover:opacity-100 cursor-help' : ''}`}>
                      {sentence.pinyin}
                    </div>
                    
                    <div className={`font-sans text-[24px] font-medium tracking-[0.5px] leading-[1.35] text-[#2B2622] dark:text-white transition-all duration-300 ${!showChinese ? 'blur-md opacity-30 hover:blur-none hover:opacity-100 cursor-help' : ''}`}>
                      {sentence.chinese_text}
                    </div>
                    
                    <div className={`text-[15px] text-[#7C7263] dark:text-white/60 font-semibold mt-[7px] transition-all duration-300 ${!showMeaning ? 'blur-sm opacity-30 hover:blur-none hover:opacity-100 cursor-help' : ''}`}>
                      {sentence.vietnamese_text}
                    </div>
                  </div>

                  {/* Play button (individual) */}
                  <button 
                    onClick={(e) => playIndividual(idx, e)}
                    disabled={!sentence.audio_url}
                    className="shrink-0 w-[44px] h-[44px] rounded-full border-none cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(193,39,45,0.22)] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: isPlaying ? "#A21E23" : "#C1272D", color: "#FFF3DC" }}
                    aria-label="Nghe"
                  >
                    {isPlaying ? (
                      <div className="flex items-center gap-[3px] h-4">
                        <span className="w-[3px] h-4 bg-current rounded-sm animate-[soundPulse_0.6s_ease-in-out_infinite]"></span>
                        <span className="w-[3px] h-4 bg-current rounded-sm animate-[soundPulse_0.6s_ease-in-out_0.2s_infinite]"></span>
                        <span className="w-[3px] h-4 bg-current rounded-sm animate-[soundPulse_0.6s_ease-in-out_0.4s_infinite]"></span>
                      </div>
                    ) : (
                      <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor"><path d="M2 1.5c0-.9 1-1.5 1.8-1L14 6.5c.8.5.8 1.7 0 2.2L3.8 15c-.8.5-1.8-.1-1.8-1V1.5z" transform="translate(0 .5)"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
