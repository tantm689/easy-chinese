"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VocabExercise } from "@/lib/queries";
import { markStepVisited } from "@/lib/progressUtils";

export default function VocabExerciseClient({
  exercises,
  lessonId,
}: {
  exercises: VocabExercise[];
  lessonId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    markStepVisited(lessonId, "vocab-exercise");
  }, [lessonId]);

  useEffect(() => {
    if (!currentExercise) return;

    // Build options: 1 correct + 3 wrong, rồi shuffle
    const allOptions = [currentExercise.correct_answer, ...currentExercise.wrong_choices];
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setSelectedAnswer(null);
    setHasChecked(false);
  }, [currentIndex, currentExercise]);

  if (exercises.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl border border-primary/10 shadow-sm animate-fade-in-up">
        <p className="text-foreground/60 mb-4">Chưa có bài tập điền từ cho bài học này.</p>
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
      setSelectedAnswer(null);
      setHasChecked(false);
    };

    return (
      <div className="text-center py-[50px] bg-[#FFFDF8] dark:bg-[#FFFDF8]/5 rounded-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] dark:shadow-none border border-[#EFE4CE] dark:border-white/10 animate-fade-in-up">
        <div className="text-[64px] mb-4">🎉</div>
        <h2 className="text-[28px] font-bold text-[#C1272D] mb-3">Hoàn thành bài tập!</h2>
        <p className="text-[18px] text-[#2B2622] dark:text-white/80 font-medium mb-8">
          Bạn đạt điểm: <span className="text-[#A21E23] font-bold text-[24px]">{score}/{exercises.length}</span>
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

  const handleCheck = () => {
    if (!selectedAnswer) return;
    setHasChecked(true);
    if (selectedAnswer === currentExercise.correct_answer) {
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

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-foreground/60 font-medium mb-2">
          <span>Câu {currentIndex + 1} / {exercises.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#25221c] p-8 md:p-10 rounded-[var(--radius-card)] shadow-sm border border-black/5 dark:border-white/5 text-center">
        {/* Hiển thị từ cần hỏi */}
        <div className="mb-10">
          <p className="text-sm text-foreground/40 font-semibold mb-2">{currentExercise.pinyin}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            {currentExercise.chinese_word}
          </h2>
          <p className="text-foreground/50 text-sm">Chọn nghĩa đúng của từ này</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {options.map((option, i) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentExercise.correct_answer;
            
            let btnClass = "py-4 px-6 rounded-2xl border-2 font-bold text-lg transition-all duration-200 active:scale-95 ";
            
            if (!hasChecked) {
              btnClass += isSelected 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-black/10 dark:border-white/10 text-foreground hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5";
            } else {
              if (isCorrect) {
                btnClass += "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400";
              } else if (isSelected && !isCorrect) {
                btnClass += "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
              } else {
                btnClass += "border-black/5 dark:border-white/5 text-foreground/40 opacity-50";
              }
            }

            return (
              <button
                key={`${option}-${i}`}
                disabled={hasChecked}
                onClick={() => setSelectedAnswer(option)}
                className={btnClass}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          {!hasChecked ? (
            <button
              disabled={!selectedAnswer}
              onClick={handleCheck}
              className="w-full sm:w-auto min-w-[200px] py-4 bg-primary text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover hover:shadow-lg transition-all"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto min-w-[200px] py-4 bg-accent text-white font-bold rounded-full hover:brightness-110 hover:shadow-lg transition-all"
            >
              {currentIndex < exercises.length - 1 ? "Câu tiếp theo" : "Hoàn thành"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
