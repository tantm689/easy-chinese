"use client";

import { useState, useRef, useEffect } from "react";
import { SentencePattern } from "@/lib/queries";
import { markStepVisited } from "@/lib/progressUtils";
import PronunciationCheck from "@/components/PronunciationCheck";

export default function PatternsClient({
  patterns,
  lessonId,
}: {
  patterns: SentencePattern[];
  lessonId: string;
}) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [activePronunciationId, setActivePronunciationId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    markStepVisited(lessonId, "patterns");
  }, [lessonId]);

  useEffect(() => {
    if (playingIndex !== null) {
      const url = patterns[playingIndex]?.audio_url;
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
  }, [playingIndex, patterns]);

  const playIndividual = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setActivePronunciationId(null);
    if (playingIndex === index) {
      setPlayingIndex(null);
    } else {
      setPlayingIndex(index);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[20px]">
        {patterns.map((pattern, idx) => {
          const isPlaying = playingIndex === idx;

          return (
            <div 
              key={pattern.id} 
              className="bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 border rounded-[24px] px-[24px] pt-[22px] pb-[24px] shadow-[0_6px_24px_rgba(120,90,40,0.06)] dark:shadow-none animate-fade-in-up transition-all duration-300"
              style={{ 
                animationDelay: `${idx * 60}ms`,
                borderColor: isPlaying ? '#C1272D' : 'rgba(239, 228, 206, 1)'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#B9AD98] dark:text-white/40 font-semibold tracking-[0.3px] mb-[4px]">
                    {pattern.pinyin}
                  </div>
                  <div className="font-sans text-[28px] font-medium tracking-[0.5px] leading-[1.35] text-[#2B2622] dark:text-white mb-[8px]">
                    {pattern.chinese_text}
                  </div>
                  <div className="text-[16px] text-[#7C7263] dark:text-white/60 font-medium">
                    {pattern.vietnamese_text}
                  </div>
                </div>

                {/* Play button */}
                <button 
                  onClick={(e) => playIndividual(idx, e)}
                  disabled={!pattern.audio_url}
                  className="shrink-0 w-[48px] h-[48px] rounded-full border-none cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(193,39,45,0.22)] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-2"
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
                    <svg width="18" height="20" viewBox="0 0 16 18" fill="currentColor"><path d="M2 1.5c0-.9 1-1.5 1.8-1L14 6.5c.8.5.8 1.7 0 2.2L3.8 15c-.8.5-1.8-.1-1.8-1V1.5z" transform="translate(0 .5)"/></svg>
                  )}
                </button>
              </div>

              {/* Pronunciation Check */}
              <div className="mt-4 flex justify-end">
                <PronunciationCheck 
                  targetText={pattern.chinese_text}
                  isActive={activePronunciationId === pattern.id}
                  onStart={() => setActivePronunciationId(pattern.id)}
                  mode="sentence"
                />
              </div>

              {pattern.analysis && (
                <div className="mt-5 bg-[#F6EFE0]/50 dark:bg-black/20 rounded-[16px] p-[16px] border border-[#EADEC4] dark:border-white/5">
                  <div className="text-[13px] uppercase font-bold text-[#D4AF37] tracking-[1.5px] mb-2 flex items-center gap-2">
                    <span className="w-[6px] h-[6px] rounded-full bg-[#D4AF37]"></span>
                    Cách ghép câu
                  </div>
                  <div className="text-[14px] text-[#5C5446] dark:text-white/70 font-medium leading-[1.6]">
                    {pattern.analysis}
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
