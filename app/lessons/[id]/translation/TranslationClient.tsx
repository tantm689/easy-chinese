"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Lesson, DialogueSentence, SentencePattern } from "@/lib/queries";

type Direction = 'ZH_TO_VI' | 'VI_TO_ZH';

interface Question {
  id: string;
  direction: Direction;
  sourceText: string;
  targetText: string;
  pinyin: string;
  audioUrl?: string | null;
  choices?: string[];
  sentence: DialogueSentence;
}

export default function TranslationClient({
  lesson,
  sentences,
  patterns
}: {
  lesson: Lesson;
  sentences: DialogueSentence[];
  patterns: SentencePattern[];
}) {
  type ExerciseMode = 'ZH_TO_VI' | 'VI_TO_ZH' | 'MIXED';

  const [exerciseMode, setExerciseMode] = useState<ExerciseMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<'typing' | 'checked' | 'finished'>('typing');
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [punctuationWarning, setPunctuationWarning] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize questions
  const initExercise = (mode: ExerciseMode) => {
    setExerciseMode(mode);

    const allVietnameseTexts = [
      ...sentences.map(s => s.vietnamese_text),
      ...patterns.map(p => p.vietnamese_text)
    ].filter(Boolean);

    let bools: boolean[] = [];
    if (mode === 'MIXED') {
      const flip = Math.random() > 0.5;
      bools = sentences.map((_, i) => flip ? i % 2 === 0 : i % 2 !== 0);
      for (let i = bools.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bools[i], bools[j]] = [bools[j], bools[i]];
      }
    } else {
      bools = sentences.map(() => mode === 'ZH_TO_VI');
    }

    const newQuestions = [...sentences].map((s, index) => {
      const isZhToVi = bools[index];
      
      if (isZhToVi) {
        // ZH_TO_VI: Multiple choice
        let wrongChoices = allVietnameseTexts.filter(t => t !== s.vietnamese_text);
        
        for (let i = wrongChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [wrongChoices[i], wrongChoices[j]] = [wrongChoices[j], wrongChoices[i]];
        }
        
        // Pick up to 3 wrong choices (fallback to fewer if not enough data)
        let selectedWrong = wrongChoices.slice(0, 3);
        // If really short on data, we just pad it with dummy data so it doesn't crash
        if (selectedWrong.length < 3) {
           const fallbacks = ["Tôi không biết", "Cái này rất ngon", "Hôm nay trời đẹp"];
           selectedWrong = [...selectedWrong, ...fallbacks].slice(0, 3);
        }
        
        let choices = [s.vietnamese_text, ...selectedWrong];
        
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        return {
          id: s.id + '_zh_vi',
          direction: 'ZH_TO_VI' as Direction,
          sourceText: s.chinese_text,
          targetText: s.vietnamese_text,
          pinyin: s.pinyin,
          audioUrl: s.audio_url,
          choices,
          sentence: s
        };
      } else {
        // VI_TO_ZH: Free typing
        return {
          id: s.id + '_vi_zh',
          direction: 'VI_TO_ZH' as Direction,
          sourceText: s.vietnamese_text,
          targetText: s.chinese_text,
          pinyin: s.pinyin,
          audioUrl: s.audio_url,
          sentence: s
        };
      }
    });

    // Shuffle questions
    for (let i = newQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newQuestions[i], newQuestions[j]] = [newQuestions[j], newQuestions[i]];
    }

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setUserInput("");
    setSelectedChoice(null);
    setStatus('typing');
    setScore(0);
    setShowPinyin(false);
    setPunctuationWarning(null);
  };

  useEffect(() => {
    if (status === 'typing' && questions[currentIndex]?.direction === 'VI_TO_ZH' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status, currentIndex, questions]);

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      // Loại bỏ toàn bộ khoảng trắng
      .replace(/\s/g, '')
      // Loại bỏ toàn bộ dấu câu tiếng Anh và tiếng Trung
      .replace(/[,.!?，。！？;；:：""''「」『』()（）<>《》\-~～]/g, '');
  };

  const handleCheckTyping = () => {
    if (!userInput.trim()) return;
    const currentQ = questions[currentIndex];
    const normalizedInput = normalize(userInput);
    
    const isMatch = normalize(currentQ.targetText) === normalizedInput;
    
    if (isMatch) {
      const puncRegex = /[,.!?，。！？;；:：""''「」『』()（）<>《》\-~～]/g;
      const targetPuncs = currentQ.targetText.match(puncRegex) || [];
      const inputPuncs = userInput.match(puncRegex) || [];
      
      const missing = [];
      const inputPuncsCopy = [...inputPuncs];
      
      for (const p of targetPuncs) {
        const idx = inputPuncsCopy.indexOf(p);
        if (idx !== -1) {
          inputPuncsCopy.splice(idx, 1);
        } else {
          missing.push(p);
        }
      }
      
      const extra = inputPuncsCopy;
      
      if (missing.length > 0 || extra.length > 0) {
        let warnParts = [];
        if (missing.length > 0) warnParts.push(`thiếu dấu ${Array.from(new Set(missing)).join(' ')}`);
        if (extra.length > 0) warnParts.push(`thừa/sai dấu ${Array.from(new Set(extra)).join(' ')}`);
        setPunctuationWarning(`Chú ý: Bạn gõ ${warnParts.join(' và ')}`);
      } else {
        setPunctuationWarning(null);
      }
      setScore(s => s + 1);
    } else {
      setPunctuationWarning(null);
    }
    
    setIsCorrect(isMatch);
    setStatus('checked');
  };

  const handleChoiceSelect = (choice: string) => {
    if (status !== 'typing') return;
    const currentQ = questions[currentIndex];
    setSelectedChoice(choice);
    const isMatch = choice === currentQ.targetText;
    setIsCorrect(isMatch);
    if (isMatch) setScore(s => s + 1);
    setPunctuationWarning(null);
    setStatus('checked');
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setUserInput("");
      setSelectedChoice(null);
      setStatus('typing');
      setShowPinyin(false);
      setPunctuationWarning(null);
    } else {
      setStatus('finished');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (status === 'typing' && questions[currentIndex].direction === 'VI_TO_ZH') {
        handleCheckTyping();
      } else if (status === 'checked') {
        handleNext();
      }
    }
  };
  
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  if (!exerciseMode) {
    return (
      <main className="flex flex-col items-center justify-center pt-12 pb-20 px-6 max-w-4xl mx-auto min-h-[80vh] animate-fade-in">
        <Link href={`/topics/${lesson.topic_id}/lessons`} className="self-start text-foreground/50 hover:text-[#C1272D] font-bold mb-8 transition-colors flex items-center gap-2">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Danh sách bài học
        </Link>
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFFDF8] border-2 border-[#EFE4CE] rounded-3xl mb-6 shadow-sm rotate-3">
            <span className="text-4xl">✍️</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Chọn chế độ luyện dịch</h1>
          <p className="text-foreground/60 text-lg max-w-lg mx-auto">
            Bạn muốn tập trung vào kỹ năng nào? Hãy chọn một chế độ bên dưới để bắt đầu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Mode: Trung -> Việt */}
          <button 
            onClick={() => initExercise('ZH_TO_VI')}
            className="group flex flex-col items-center p-8 bg-white dark:bg-[#25221c] rounded-[2rem] border-2 border-black/5 hover:border-[#C1272D]/30 transition-all hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(193,39,45,0.08)]"
          >
            <div className="w-16 h-16 bg-[#C1272D]/10 text-[#C1272D] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              🇨🇳 
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Trung → Việt</h3>
            <p className="text-foreground/60 text-sm text-center">Đọc hiểu câu tiếng Trung và chọn đáp án dịch đúng</p>
          </button>

          {/* Mode: Việt -> Trung */}
          <button 
            onClick={() => initExercise('VI_TO_ZH')}
            className="group flex flex-col items-center p-8 bg-white dark:bg-[#25221c] rounded-[2rem] border-2 border-black/5 hover:border-[#D4AF37]/50 transition-all hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(212,175,55,0.1)]"
          >
            <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
              🇻🇳
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Việt → Trung</h3>
            <p className="text-foreground/60 text-sm text-center">Luyện tư duy và gõ chữ Hán từ câu tiếng Việt</p>
          </button>

          {/* Mode: Mixed */}
          <button 
            onClick={() => initExercise('MIXED')}
            className="group flex flex-col items-center p-8 bg-gradient-to-br from-[#FFFDF8] to-[#FFF6E4] dark:from-[#2a261f] dark:to-[#25221c] rounded-[2rem] border-2 border-[#EFE4CE] dark:border-white/10 hover:border-[#C1272D] transition-all hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(193,39,45,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C1272D]/5 rounded-bl-[100px]"></div>
            <div className="w-16 h-16 bg-white dark:bg-black/20 shadow-sm rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform relative z-10">
              🔀
            </div>
            <h3 className="text-xl font-bold text-[#C1272D] mb-2 relative z-10">Trộn lẫn</h3>
            <p className="text-foreground/70 text-sm text-center relative z-10">Kết hợp cả hai kỹ năng với các câu ngẫu nhiên</p>
          </button>
        </div>
      </main>
    );
  }

  if (questions.length === 0) return null;

  if (status === 'finished') {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <main className="flex flex-col items-center pt-8 pb-20 px-6 max-w-2xl mx-auto min-h-screen">
        <Link href={`/topics/${lesson.topic_id}/lessons`} className="self-start text-foreground/50 hover:text-[#C1272D] font-bold mb-8 transition-colors flex items-center gap-2">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Danh sách bài học
        </Link>
        
        <div className="w-full bg-white dark:bg-[#25221c] rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 dark:border-white/5 text-center animate-fade-in-up">
          <div className="text-6xl mb-6">{percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Hoàn thành luyện dịch!</h1>
          
          <div className="flex justify-center items-center gap-8 my-8">
            <div className="text-center">
              <p className="text-5xl font-black text-[#C1272D] mb-2">{score}/{questions.length}</p>
              <p className="text-foreground/60 font-semibold uppercase tracking-widest text-sm">Chính xác</p>
            </div>
            <div className="w-px h-16 bg-black/10 dark:bg-white/10"></div>
            <div className="text-center">
              <p className="text-5xl font-black text-[#D4AF37] mb-2">{percentage}%</p>
              <p className="text-foreground/60 font-semibold uppercase tracking-widest text-sm">Tỷ lệ đúng</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <button 
              onClick={() => setExerciseMode(null)}
              className="flex-1 max-w-[220px] mx-auto sm:mx-0 py-4 px-6 rounded-2xl bg-[#FFFDF8] border-2 border-[#EFE4CE] text-[#C1272D] font-bold text-lg hover:bg-[#FBF6EC] transition-all shadow-sm"
            >
              Chọn chế độ khác
            </button>
            <button 
              onClick={() => initExercise(exerciseMode)}
              className="flex-1 max-w-[220px] mx-auto sm:mx-0 py-4 px-6 rounded-2xl bg-[#C1272D] text-[#FFF6E4] font-bold text-lg hover:bg-[#A21E23] transition-all shadow-[0_4px_12px_rgba(193,39,45,0.22)]"
            >
              Làm lại
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentQ = questions[currentIndex];
  const isTypingMode = currentQ.direction === 'VI_TO_ZH';

  return (
    <main className="flex flex-col pt-8 pb-32 px-4 sm:px-6 max-w-3xl mx-auto min-h-screen">
      {currentQ.audioUrl && (
        <audio ref={audioRef} src={currentQ.audioUrl} preload="auto" />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setExerciseMode(null)} className="text-foreground/40 hover:text-[#C1272D] transition-colors p-3 -ml-3 rounded-full hover:bg-[#C1272D]/5">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="text-[#C1272D] font-bold bg-[#C1272D]/10 px-5 py-2 rounded-full text-sm tracking-wide shadow-sm">
          Câu {currentIndex + 1} / {questions.length}
        </div>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full mb-10 overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[#E8C55A] to-[#D4AF37] transition-all duration-700 ease-out rounded-full"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col items-center w-full animate-fade-in mt-2">
        <div className="w-full text-center mb-8">
          <div className="inline-flex flex-col items-center mb-6">
            <span className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-foreground/50 font-bold uppercase tracking-widest text-[11px] border border-black/5 mb-4">
              {isTypingMode ? '🇻🇳 Dịch sang tiếng Trung' : '🇨🇳 Dịch sang tiếng Việt'}
            </span>
            
            <div className="flex flex-col items-center gap-4 justify-center">
              <div className="flex items-center gap-3 justify-center">
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-[1.4] tracking-tight">
                  {currentQ.sourceText}
                </h2>
                {!isTypingMode && currentQ.audioUrl && (
                  <button 
                    onClick={playAudio}
                    className="w-10 h-10 rounded-full bg-[#C1272D]/10 text-[#C1272D] flex items-center justify-center hover:bg-[#C1272D] hover:text-white transition-colors shrink-0"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" /><path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" /></svg>
                  </button>
                )}
              </div>

              {/* Hint Actions for VI_TO_ZH */}
              {isTypingMode && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {currentQ.audioUrl && (
                    <button
                      onClick={playAudio}
                      className="px-4 py-2 rounded-full bg-[#C1272D]/10 text-[#C1272D] text-sm font-bold hover:bg-[#C1272D] hover:text-white transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" /><path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" /></svg>
                      Nghe Audio
                    </button>
                  )}
                  {!showPinyin && currentQ.pinyin && (
                    <button
                      onClick={() => setShowPinyin(true)}
                      className="px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      💡 Gợi ý Pinyin
                    </button>
                  )}
                  {showPinyin && currentQ.pinyin && (
                    <button
                      onClick={() => setShowPinyin(false)}
                      className="px-4 py-2 rounded-full bg-[#FFFDF8] dark:bg-[#25221c] border border-[#EFE4CE] dark:border-white/10 text-foreground/80 text-sm font-semibold tracking-wide shadow-sm hover:bg-[#FBF6EC] transition-colors flex items-center gap-2 group"
                      title="Nhấn để ẩn Pinyin"
                    >
                      <span>{currentQ.pinyin}</span>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="opacity-40 group-hover:opacity-100 transition-opacity"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isTypingMode ? (
          // TYPING MODE (VI -> ZH)
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#C1272D]/5 to-transparent opacity-0 group-focus-within:opacity-100 rounded-[2rem] transition-opacity duration-500 pointer-events-none -z-10"></div>
              <textarea
                ref={inputRef as any}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={status !== 'typing'}
                placeholder="Nhập chữ Hán của bạn vào đây..."
                className={`w-full p-8 text-xl sm:text-2xl rounded-[2rem] border-2 transition-all outline-none resize-none min-h-[140px] shadow-sm font-medium ${
                  status === 'typing' 
                    ? 'bg-white dark:bg-[#1a1814] border-black/10 dark:border-white/10 focus:border-[#C1272D] focus:shadow-[0_8px_30px_rgba(193,39,45,0.12)] placeholder:text-black/20 dark:placeholder:text-white/20' 
                    : isCorrect
                      ? 'bg-[#4CAF50]/10 border-[#4CAF50] text-[#4CAF50] shadow-[0_8px_30px_rgba(76,175,80,0.15)]'
                      : 'bg-[#C1272D]/5 border-[#C1272D] text-[#C1272D] shadow-[0_8px_30px_rgba(193,39,45,0.15)]'
                }`}
              />
            </div>
          </div>
        ) : (
          // MULTIPLE CHOICE MODE (ZH -> VI)
          <div className="w-full max-w-2xl grid grid-cols-1 gap-4">
            {currentQ.choices?.map((choice, idx) => {
              const isSelected = selectedChoice === choice;
              const isCorrectChoice = choice === currentQ.targetText;
              
              let choiceStyle = "bg-white dark:bg-[#25221c] border-black/10 dark:border-white/10 hover:border-[#C1272D]/50 hover:bg-[#C1272D]/5";
              
              if (status !== 'typing') {
                if (isCorrectChoice) {
                  choiceStyle = "bg-[#4CAF50]/10 border-[#4CAF50] text-[#4CAF50] shadow-[0_4px_15px_rgba(76,175,80,0.15)]";
                } else if (isSelected && !isCorrectChoice) {
                  choiceStyle = "bg-[#C1272D]/10 border-[#C1272D] text-[#C1272D]";
                } else {
                  choiceStyle = "bg-white/50 border-black/5 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={status !== 'typing'}
                  className={`w-full text-left p-5 sm:p-6 rounded-2xl border-2 transition-all font-medium text-lg flex items-center justify-between ${choiceStyle}`}
                >
                  <span>{choice}</span>
                  {status !== 'typing' && isCorrectChoice && (
                    <span className="w-6 h-6 rounded-full bg-[#4CAF50] text-white flex items-center justify-center">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                  )}
                  {status !== 'typing' && isSelected && !isCorrectChoice && (
                    <span className="w-6 h-6 rounded-full bg-[#C1272D] text-white flex items-center justify-center">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      {status === 'typing' && isTypingMode ? (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-black/5 dark:border-white/5 flex justify-center z-50">
          <div className="w-full max-w-3xl flex justify-end">
            <button
              onClick={handleCheckTyping}
              disabled={!userInput.trim()}
              className="bg-[#C1272D] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-lg px-12 py-4 rounded-2xl transition-all shadow-[0_4px_14px_rgba(193,39,45,0.25)] disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
            >
              Kiểm tra
            </button>
          </div>
        </div>
      ) : status !== 'typing' ? (
        <div className={`fixed bottom-0 left-0 right-0 p-6 sm:px-12 sm:py-8 border-t z-50 animate-slide-up flex justify-center ${
          isCorrect ? (punctuationWarning ? 'bg-[#FFFDF8] dark:bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'bg-[#F2FBF5] dark:bg-[#4CAF50]/10 border-[#4CAF50]/20') : 'bg-[#FFF5F5] dark:bg-[#C1272D]/10 border-[#C1272D]/20'
        }`}>
          <div className="w-full max-w-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 sm:mt-0 ${
                isCorrect ? (punctuationWarning ? 'bg-[#D4AF37] text-white' : 'bg-[#4CAF50] text-white') : 'bg-[#C1272D] text-white'
              }`}>
                {isCorrect ? (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-1 ${isCorrect ? (punctuationWarning ? 'text-[#D4AF37]' : 'text-[#4CAF50]') : 'text-[#C1272D]'}`}>
                  {isCorrect ? (punctuationWarning ? 'Gần đúng!' : 'Chính xác!') : 'Chưa đúng'}
                </h3>
                
                {punctuationWarning && (
                  <div className="mt-1 space-y-1">
                    <p className="text-[#D4AF37] font-medium">{punctuationWarning}</p>
                    <p className="text-foreground/70 text-sm">
                      Đáp án đầy đủ: <span className="font-bold text-[#D4AF37] text-base">{currentQ.targetText}</span>
                    </p>
                  </div>
                )}
                
                {!isCorrect && isTypingMode && (
                  <div className="space-y-1">
                    <p className="text-foreground/80 font-medium">Đáp án đúng:</p>
                    <p className="text-2xl font-bold text-[#C1272D] tracking-wide">{currentQ.targetText}</p>
                    <p className="text-foreground/60">Pinyin: {currentQ.pinyin}</p>
                  </div>
                )}

                {isCorrect && !punctuationWarning && isTypingMode && (
                  <div className="space-y-1 mt-2">
                    <p className="text-2xl font-bold text-[#4CAF50] tracking-wide">{currentQ.targetText}</p>
                    <p className="text-[#4CAF50]/80">Pinyin: {currentQ.pinyin}</p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className={`w-full sm:w-auto px-12 py-4 rounded-2xl font-bold text-xl text-white transition-all hover:-translate-y-0.5 shrink-0 ${
                isCorrect 
                  ? 'bg-[#4CAF50] hover:bg-[#3d8c40] shadow-[0_4px_14px_rgba(76,175,80,0.3)]' 
                  : 'bg-[#C1272D] hover:bg-[#A21E23] shadow-[0_4px_14px_rgba(193,39,45,0.3)]'
              }`}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
