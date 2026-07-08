"use client";

import React, { useState, useEffect } from "react";

interface PronunciationCheckProps {
  targetText: string;
  buttonLabel?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
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
  buttonLabel = "🎤 Luyện phát âm",
  className = "",
  buttonClassName = "",
}: PronunciationCheckProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [result, setResult] = useState<{ status: 'correct' | 'almost' | 'incorrect', text: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const handleStart = () => {
    if (!isSupported) {
      setErrorMsg("Trình duyệt không hỗ trợ tính năng này, vui lòng dùng Chrome hoặc Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setResult(null);
      setErrorMsg(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
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
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
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
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setErrorMsg("Không thể khởi động ghi âm.");
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleStart}
        disabled={isListening}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[14px] font-semibold text-sm transition-all border-2 w-fit ${
          isListening 
            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] animate-pulse" 
            : "bg-transparent border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
        } ${buttonClassName}`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            Đang nghe...
          </>
        ) : (
          buttonLabel
        )}
      </button>

      {errorMsg && (
        <div className="text-[13px] text-[#C1272D] font-medium bg-[#C1272D]/10 px-3 py-1.5 rounded-lg w-fit">
          {errorMsg}
        </div>
      )}

      {result && (
        <div className={`flex flex-col gap-1 px-3 py-2 rounded-lg border w-fit ${
          result.status === 'correct' 
            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#B89420]' 
            : result.status === 'almost'
              ? 'bg-[#E8C55A]/10 border-[#E8C55A]/30 text-[#C19B26]'
              : 'bg-[#C1272D]/10 border-[#C1272D]/30 text-[#C1272D]'
        }`}>
          <div className="font-bold text-[14px] flex items-center gap-1.5">
            {result.status === 'correct' && <><span>✅</span> Chính xác!</>}
            {result.status === 'almost' && <><span>🔶</span> Gần đúng, thử lại!</>}
            {result.status === 'incorrect' && <><span>❌</span> Chưa đúng, thử lại!</>}
          </div>
          {result.status !== 'correct' && (
            <div className="text-[12px] opacity-90 font-medium">
              Bạn đọc là: <span className="font-serif text-[14px]">{result.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
