"use client";

import React, { useState, useEffect, useRef } from "react";
import { pinyin } from 'pinyin-pro';

interface PronunciationCheckProps {
  targetText: string;
  buttonLabel?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  absoluteResult?: boolean;
  isActive?: boolean;
  onStart?: () => void;
  mode?: 'sentence' | 'word';
}

const normalizeText = (text: string) => {
  if (!text) return "";
  // Remove Chinese and English punctuation, and whitespaces
  return text
    .replace(/[。，！？、；：“”‘’（）《》〈〉【】\.\,\!\?\;\:\"\'\(\)\[\]\s]/g, "")
    .trim()
    .toLowerCase();
};

const levenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export default function PronunciationCheck({
  targetText,
  buttonLabel = "🎤 Chấm phát âm",
  className = "",
  buttonClassName = "",
  absoluteResult = false,
  isActive = true,
  onStart,
  mode = 'sentence',
}: PronunciationCheckProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<{ 
    status: 'correct' | 'almost' | 'incorrect', 
    text: string, 
    targetPinyin?: string, 
    transcriptPinyin?: string 
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef<'idle' | 'listening' | 'result' | 'error' | 'aborted'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Reset state when targetText changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    if (recognitionRef.current && isListening) {
      statusRef.current = 'aborted';
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setResult(null);
    setErrorMsg(null);
    setIsListening(false);
    statusRef.current = 'idle';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText]);

  // Reset state when component becomes inactive
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCountdown(null);
      if (recognitionRef.current && isListening) {
        statusRef.current = 'aborted';
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      setResult(null);
      setErrorMsg(null);
      setIsListening(false);
      statusRef.current = 'idle';
    }
  }, [isActive]);

  const handleStart = () => {
    if (!isSupported) {
      setErrorMsg("Trình duyệt không hỗ trợ tính năng này, vui lòng dùng Chrome hoặc Edge.");
      return;
    }
    
    if (onStart) onStart();

    if (mode === 'word') {
      let count = 3;
      setCountdown(count);
      const tick = () => {
        count--;
        if (count > 0) {
          setCountdown(count);
          timerRef.current = setTimeout(tick, 400);
        } else {
          setCountdown(null);
          startRecognition();
        }
      };
      timerRef.current = setTimeout(tick, 400);
    } else {
      startRecognition();
    }
  };

  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      statusRef.current = 'listening';
      setIsListening(true);
      setResult(null);
      setErrorMsg(null);
    };

    recognition.onresult = (event: any) => {
      statusRef.current = 'result';
      const transcript = event.results[0][0].transcript;
      
      if (mode === 'word') {
        const targetPinyinTone = pinyin(targetText, { toneType: 'symbol', type: 'array' }).join('');
        const transPinyinTone = pinyin(transcript, { toneType: 'symbol', type: 'array' }).join('');
        const targetPinyinNoTone = pinyin(targetText, { toneType: 'none', type: 'array' }).join('');
        const transPinyinNoTone = pinyin(transcript, { toneType: 'none', type: 'array' }).join('');

        if (targetPinyinTone === transPinyinTone) {
          setResult({ status: 'correct', text: transcript });
        } else if (targetPinyinNoTone === transPinyinNoTone) {
          setResult({ 
            status: 'almost', 
            text: transcript,
            targetPinyin: pinyin(targetText, { toneType: 'symbol' }),
            transcriptPinyin: pinyin(transcript, { toneType: 'symbol' })
          });
        } else {
          setResult({ 
            status: 'incorrect', 
            text: transcript,
            transcriptPinyin: pinyin(transcript, { toneType: 'symbol' })
          });
        }
      } else {
        const normTarget = normalizeText(targetText);
        const normTranscript = normalizeText(transcript);
        
        const dist = levenshteinDistance(normTarget, normTranscript);
        const maxLen = Math.max(normTarget.length, normTranscript.length);
        const accuracy = maxLen === 0 ? 0 : (maxLen - dist) / maxLen;
        
        if (accuracy === 1) {
          setResult({ status: 'correct', text: transcript });
        } else if (accuracy >= 0.6) {
          setResult({ status: 'almost', text: transcript });
        } else {
          setResult({ status: 'incorrect', text: transcript });
        }
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        statusRef.current = 'aborted';
        setIsListening(false);
        return;
      }
      statusRef.current = 'error';
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMsg("Không thể truy cập Micro. Vui lòng cấp quyền trong cài đặt trình duyệt.");
      } else if (event.error === 'no-speech') {
        setErrorMsg("Không nghe rõ, vui lòng thử lại.");
      } else {
        setErrorMsg(`Có lỗi xảy ra: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (statusRef.current === 'listening') {
        // Recognition ended silently without result or error
        statusRef.current = 'error';
        setErrorMsg("Không nghe rõ, hãy thử lại nhé!");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      statusRef.current = 'error';
      setIsListening(false);
      setErrorMsg("Không thể khởi động ghi âm.");
    }
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);

    if (recognitionRef.current) {
      statusRef.current = 'aborted';
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setIsListening(false);
    setResult(null);
    setErrorMsg(null);
  };

  const targetNorm = normalizeText(targetText);
  const transcriptNorm = result ? normalizeText(result.text) : "";
  const maxLen = Math.max(targetNorm.length, transcriptNorm.length);

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {(isListening || countdown !== null) ? (
          <>
            <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[14px] font-semibold text-sm transition-all border-2 bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] ${countdown === null ? 'animate-pulse' : ''} ${buttonClassName}`}>
              {countdown !== null ? (
                <>Chuẩn bị... {countdown}</>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                  Đang nghe...
                </>
              )}
            </div>
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-[14px] font-semibold text-sm transition-all border-2 bg-transparent border-[#C1272D] text-[#C1272D] hover:bg-[#C1272D] hover:text-white shrink-0"
            >
              Dừng
            </button>
          </>
        ) : (
            <button
              onClick={handleStart}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[14px] font-semibold text-sm transition-all border-2 bg-transparent border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white ${buttonClassName}`}
            >
              {mode === 'word' && result 
                ? (result.status === 'correct' ? "✅ Phát âm chính xác! luyện lại 🔄" : "❌ Chưa chính xác. Thử lại 🔄")
                : buttonLabel}
            </button>
          )}
      </div>

      {/* Result Container */}
      {(errorMsg || result) && (
        <div className={`${absoluteResult ? "absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[100] min-w-[340px] max-w-[90vw]" : "mt-2 w-full max-w-lg"}`}>
          
          {errorMsg && (
            <div className="text-[13px] text-[#C1272D] font-medium bg-[#FFFDF8] dark:bg-[#1a1814] border border-[#C1272D]/20 shadow-xl px-5 py-3.5 rounded-[16px] flex items-center justify-center animate-fade-in-up">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className={`flex flex-col gap-4 p-5 rounded-[24px] border backdrop-blur-xl animate-fade-in-up shadow-[0_12px_40px_rgba(0,0,0,0.08)] ${
              result.status === 'correct' 
                ? 'bg-[#FFFDF8]/95 dark:bg-[#1a1814]/95 border-[#D4AF37]/30' 
                : result.status === 'almost'
                  ? 'bg-[#FFFDF8]/95 dark:bg-[#1a1814]/95 border-[#E8C55A]/40'
                  : 'bg-[#FFFDF8]/95 dark:bg-[#1a1814]/95 border-[#C1272D]/20'
            }`}>
              <div className="flex items-center gap-3.5">
                {result.status === 'correct' && <div className="w-[38px] h-[38px] shrink-0 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 text-[#B89420] border border-[#D4AF37]/20 flex items-center justify-center text-[18px] shadow-sm">✅</div>}
                {result.status === 'almost' && <div className="w-[38px] h-[38px] shrink-0 rounded-full bg-gradient-to-br from-[#E8C55A]/20 to-[#E8C55A]/5 text-[#C19B26] border border-[#E8C55A]/20 flex items-center justify-center text-[18px] shadow-sm">🔶</div>}
                {result.status === 'incorrect' && <div className="w-[38px] h-[38px] shrink-0 rounded-full bg-gradient-to-br from-[#C1272D]/10 to-[#C1272D]/5 text-[#C1272D] border border-[#C1272D]/10 flex items-center justify-center text-[18px] shadow-sm">❌</div>}
                
                <div className="flex flex-col">
                  <div className={`font-bold text-[16px] tracking-wide ${
                    result.status === 'correct' ? 'text-[#B89420]' : result.status === 'almost' ? 'text-[#C19B26]' : 'text-[#C1272D]'
                  }`}>
                    {result.status === 'correct' && "Phát âm chính xác!"}
                    {result.status === 'almost' && (mode === 'word' ? "Đúng âm nhưng sai thanh điệu, thử lại!" : "Gần đúng rồi, cố lên!")}
                    {result.status === 'incorrect' && "Chưa chính xác, thử lại nhé!"}
                  </div>
                  {result.status !== 'correct' && mode === 'sentence' && (
                    <div className="text-[12px] font-medium text-foreground/40 mt-0.5">
                      So sánh chi tiết điểm sai ở bên dưới
                    </div>
                  )}
                </div>
              </div>
              
              {mode === 'sentence' && result.status !== 'correct' && (
                <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-[16px] p-4 border border-black/5 dark:border-white/5">
                <div className="flex flex-col gap-3.5">
                  
                  {/* Target Row */}
                  <div className="flex items-start gap-3">
                    <div className="text-[10px] font-sans font-bold text-foreground/40 uppercase mt-[6px] w-8 shrink-0 text-right">Mẫu</div>
                    <div className="flex flex-wrap gap-x-1 gap-y-2 font-serif text-[18px] leading-tight">
                      {Array.from({ length: maxLen }).map((_, i) => {
                        const tChar = targetNorm[i];
                        const pChar = transcriptNorm[i];
                        const isMatch = tChar === pChar;
                        if (!tChar) return null;
                        return (
                          <span key={`t-${i}`} className={`px-1.5 py-0.5 rounded-[6px] transition-colors ${isMatch ? "text-foreground" : "text-[#C1272D] font-bold bg-[#C1272D]/10"}`}>
                            {tChar}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-black/5 dark:bg-white/5"></div>
                  
                  {/* Transcript Row */}
                  <div className="flex items-start gap-3">
                    <div className="text-[10px] font-sans font-bold text-foreground/40 uppercase mt-[6px] w-8 shrink-0 text-right">Bạn</div>
                    <div className="flex flex-wrap gap-x-1 gap-y-2 font-serif text-[18px] leading-tight">
                      {Array.from({ length: maxLen }).map((_, i) => {
                        const tChar = targetNorm[i];
                        const pChar = transcriptNorm[i];
                        const isMatch = tChar === pChar;
                        if (!pChar) return null;
                        return (
                          <span key={`p-${i}`} className={`px-1.5 py-0.5 rounded-[6px] transition-colors ${isMatch ? "text-foreground/70" : "text-[#C1272D] font-bold bg-[#C1272D]/10"}`}>
                            {pChar}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                </div>
              </div>
              )}

              {mode === 'word' && (
                <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-[16px] px-5 py-3.5 border border-black/5 dark:border-white/5 flex flex-col gap-2">
                  <div className="text-[13px] font-medium flex gap-3">
                    <span className="text-foreground/40 uppercase font-bold w-12 text-right">Mẫu:</span>
                    <span className="font-sans text-[16px] text-foreground">{result.targetPinyin || pinyin(targetText, { toneType: 'symbol' })}</span>
                  </div>
                  <div className="text-[13px] font-medium flex gap-3">
                    <span className="text-foreground/40 uppercase font-bold w-12 text-right">Bạn đọc:</span>
                    <span className={`font-sans text-[16px] font-bold ${result.status === 'correct' ? 'text-[#B89420]' : 'text-[#C1272D]'}`}>
                      {result.transcriptPinyin || pinyin(result.text, { toneType: 'symbol' })}
                    </span>
                  </div>
                  {result.status === 'incorrect' && (
                    <div className="text-[13px] font-medium flex gap-3 opacity-60">
                      <span className="text-foreground/40 uppercase font-bold w-12 text-right">Từ:</span>
                      <span className="font-sans text-[16px]">{result.text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
