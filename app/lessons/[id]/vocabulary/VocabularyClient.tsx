"use client";

import { useState, useRef, useEffect } from "react";
import { Vocabulary } from "@/lib/queries";
import { markStepVisited } from "@/lib/progressUtils";
import PronunciationCheck from "@/components/PronunciationCheck";

export default function VocabularyClient({
  vocabulary,
  lessonId,
}: {
  vocabulary: Vocabulary[];
  lessonId: string;
}) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    markStepVisited(lessonId, "vocabulary");
  }, [lessonId]);

  useEffect(() => {
    if (playingIndex !== null) {
      const url = vocabulary[playingIndex]?.audio_url;
      if (url) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(e => console.log("Audio play failed", e));
        
        audio.onended = () => {
          setPlayingIndex(null);
        };
      } else {
        setPlayingIndex(null);
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
  }, [playingIndex, vocabulary]);

  const playIndividual = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (playingIndex === index) {
      setPlayingIndex(null);
    } else {
      setPlayingIndex(index);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[14px]">
        {vocabulary.map((v, idx) => {
          const isPlaying = playingIndex === idx;

          return (
            <div 
              key={v.id} 
              className="bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 border rounded-[20px] px-[20px] py-[18px] shadow-[0_4px_16px_rgba(120,90,40,0.05)] dark:shadow-none animate-fade-in-up transition-all duration-300" 
              style={{ 
                animationDelay: `${idx * 60}ms`,
                borderColor: isPlaying ? '#C1272D' : 'rgba(239, 228, 206, 1)'
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="shrink-0 min-w-[56px] h-[56px] px-3 bg-[#C1272D]/10 dark:bg-[#C1272D]/20 rounded-[16px] flex items-center justify-center font-serif text-[26px] text-[#C1272D] dark:text-[#F6D98B] font-bold shadow-sm transition-transform duration-300 whitespace-nowrap"
                  style={{
                    transform: isPlaying ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {v.chinese_word}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#C1272D] dark:text-[#E8C55A] font-bold tracking-wide mb-1">
                    {v.pinyin}
                  </div>
                  <div className="font-sans text-[16px] font-semibold text-[#2B2622] dark:text-white leading-snug">
                    {v.meaning}
                  </div>
                </div>

                {/* Play button */}
                <button 
                  onClick={(e) => playIndividual(idx, e)}
                  disabled={!v.audio_url}
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

              {/* Pronunciation Check */}
              <div className="mt-3 flex justify-end">
                <PronunciationCheck targetText={v.chinese_word} />
              </div>

              {v.example_sentence && (
                <div className="mt-4 pt-4 border-t border-dashed border-[#EADEC4] dark:border-white/10">
                  <div className="text-[12px] uppercase font-bold text-[#D4AF37] tracking-[1.5px] mb-2 flex items-center gap-1.5">
                    <span className="w-[4px] h-[4px] rounded-full bg-[#D4AF37]"></span>
                    Ví dụ
                  </div>
                  <div className="text-[13px] text-[#B9AD98] dark:text-white/40 font-semibold tracking-[0.3px] mb-[2px]">
                    {v.example_pinyin}
                  </div>
                  <div className="font-sans text-[20px] font-medium tracking-[0.5px] leading-[1.4] text-[#2B2622] dark:text-white mb-[4px]">
                    {v.example_sentence}
                  </div>
                  <div className="text-[14px] text-[#7C7263] dark:text-white/60 font-semibold">
                    {v.example_meaning}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
