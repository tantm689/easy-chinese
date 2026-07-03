"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SentenceExercise } from "@/lib/queries";

export default function SentenceExerciseClient({
  exercises,
  lessonId,
}: {
  exercises: SentenceExercise[];
  lessonId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Mảng các từ đã chọn (theo thứ tự)
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  // Mảng các từ còn lại có thể chọn
  const [availableWords, setAvailableWords] = useState<{ id: string; text: string }[]>([]);
  
  const [hasChecked, setHasChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (!currentExercise) return;

    // Gán id cho mỗi từ để react render list chuẩn xác (vì các từ có thể trùng nhau)
    // Cố tình xáo trộn mảng scrambled_words một lần nữa để chắc chắn
    const scrambled = [...currentExercise.scrambled_words]
      .sort(() => Math.random() - 0.5)
      .map((word, i) => ({ id: `word-${i}`, text: word }));

    setAvailableWords(scrambled);
    setSelectedWords([]);
    setHasChecked(false);
  }, [currentIndex, currentExercise]);

  if (exercises.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm animate-fade-in-up">
        <p className="text-foreground/60 mb-4">Chưa có bài tập sắp xếp câu cho bài học này.</p>
        <Link href={`/lessons/${lessonId}`} className="text-primary hover:underline font-medium">
          Quay lại bài học
        </Link>
      </div>
    );
  }

  if (isFinished) {
    const handleRetry = () => {
      setCurrentIndex(0);
      setScore(0);
      setIsFinished(false);
      setSelectedWords([]);
      setHasChecked(false);
      
      const scrambled = [...exercises[0].scrambled_words]
        .sort(() => Math.random() - 0.5)
        .map((word, i) => ({ id: `word-${i}`, text: word }));
      setAvailableWords(scrambled);
    };

    return (
      <div className="text-center py-[50px] bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 rounded-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] dark:shadow-none border border-[#EFE4CE] dark:border-white/10 animate-fade-in-up">
        <div className="text-[64px] mb-4">🏆</div>
        <h2 className="text-[28px] font-bold text-[#C1272D] mb-3">Chúc mừng bạn!</h2>
        <p className="text-[18px] text-[#2B2622] dark:text-white/80 font-medium mb-8">
          Điểm số phần sắp xếp câu: <span className="text-[#A21E23] font-bold text-[24px]">{score}/{exercises.length}</span>
        </p>
        <button 
          onClick={handleRetry}
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#FFFDF8] dark:bg-white/5 border-2 border-[#D4AF37] text-[#D4AF37] font-bold text-[16px] rounded-xl hover:bg-[#F6EFE0] dark:hover:bg-white/10 transition-colors"
        >
          ↻ Làm lại bài tập
        </button>
      </div>
    );
  }

  const handleSelectWord = (word: { id: string; text: string }) => {
    if (hasChecked) return;
    setAvailableWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
  };

  const handleDeselectWord = (word: { id: string; text: string }) => {
    if (hasChecked) return;
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setAvailableWords(prev => [...prev, word]);
  };

  const handleCheck = () => {
    setHasChecked(true);
    // So sánh chuỗi do user ghép với chuỗi đúng
    const userSentence = selectedWords.map(w => w.text).join('');
    // Xóa khoảng trắng để so sánh phòng trường hợp chuỗi đúng có hoặc không có dấu cách
    const correctCleaned = currentExercise.correct_sentence.replace(/\s+/g, '');
    const userCleaned = userSentence.replace(/\s+/g, '');
    
    if (userCleaned === correctCleaned) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      setIsFinished(true);
    }
  };

  const progress = ((currentIndex) / exercises.length) * 100;

  // Xác định xem user xếp đúng hay sai (chỉ tính khi đã ấn check)
  const userCleaned = selectedWords.map(w => w.text).join('').replace(/\s+/g, '');
  const correctCleaned = currentExercise.correct_sentence.replace(/\s+/g, '');
  const isCorrect = userCleaned === correctCleaned;

  return (
    <div className="mx-auto animate-fade-in-up">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[14px] text-[#B9AD98] font-bold mb-2">
          <span>Câu {currentIndex + 1} / {exercises.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-[8px] w-full bg-[#EADFC6] dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#C1272D] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 p-6 md:p-8 rounded-[24px] shadow-[0_4px_16px_rgba(120,90,40,0.05)] border border-[#EFE4CE] dark:border-white/10">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#2B2622] dark:text-white mb-6 text-center">
          Sắp xếp các từ sau thành câu hoàn chỉnh
        </h2>

        {/* Vùng hiển thị câu user đang ghép */}
        <div 
          className={`min-h-[80px] p-4 rounded-2xl flex flex-wrap content-start gap-2 mb-8 border-2 transition-colors duration-300 ${
            !hasChecked 
              ? "border-dashed border-[#EFE4CE] dark:border-white/20 bg-[#FBF6EC]/50 dark:bg-white/5" 
              : isCorrect 
                ? "border-[#2E5B53] bg-[#2E5B53]/10" 
                : "border-[#C1272D] bg-[#C1272D]/10"
          }`}
        >
          {selectedWords.length === 0 && !hasChecked && (
            <span className="text-[#B9AD98] dark:text-white/40 font-medium m-auto">Chạm vào từ bên dưới để ghép câu</span>
          )}
          {selectedWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleDeselectWord(word)}
              disabled={hasChecked}
              className={`px-4 py-2 text-[18px] font-bold rounded-xl shadow-sm transition-transform active:scale-95 ${
                hasChecked && isCorrect 
                  ? "bg-[#2E5B53] text-white" 
                  : hasChecked && !isCorrect 
                    ? "bg-[#C1272D] text-white" 
                    : "bg-[#C1272D] text-[#FFF6E4] hover:bg-[#A21E23]"
              }`}
            >
              {word.text}
            </button>
          ))}
        </div>

        {/* Thông báo đáp án đúng nếu làm sai */}
        {hasChecked && !isCorrect && (
          <div className="mb-8 p-4 bg-[#C1272D]/10 text-[#A21E23] rounded-2xl border border-[#C1272D]/20">
            <p className="font-bold mb-1 text-[14px] uppercase tracking-wide">Đáp án đúng là:</p>
            <p className="text-[22px] font-bold">{currentExercise.correct_sentence}</p>
          </div>
        )}

        {/* Vùng các từ có sẵn */}
        <div className="flex flex-wrap justify-center gap-3 min-h-[100px]">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleSelectWord(word)}
              disabled={hasChecked}
              className={`px-4 py-3 bg-white dark:bg-[#1A1814] border border-[#EFE4CE] dark:border-white/10 shadow-sm text-[#2B2622] dark:text-white text-[18px] font-bold rounded-xl transition-all active:scale-95 hover:border-[#D4AF37] hover:shadow-md ${
                hasChecked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {word.text}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center border-t border-dashed border-[#EFE4CE] dark:border-white/10 pt-6">
          {!hasChecked ? (
            <button
              disabled={selectedWords.length === 0}
              onClick={handleCheck}
              className="w-full py-4 bg-[#C1272D] text-[#FFF6E4] font-bold text-[17px] rounded-[18px] shadow-[0_4px_12px_rgba(193,39,45,0.22)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-[#D4AF37] text-white font-bold text-[17px] rounded-[18px] shadow-[0_4px_12px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 transition-all"
            >
              {currentIndex < exercises.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
