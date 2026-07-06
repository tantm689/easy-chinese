"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FlashcardItem } from "@/lib/queries";

type FrontSideType = 'zh' | 'vi';

export default function FlashcardClient({
  initialCards,
  lessonTitle,
  topicId,
  lessonId
}: {
  initialCards: FlashcardItem[];
  lessonTitle: string;
  topicId: string;
  lessonId: string;
}) {
  // Settings state
  const [trackProgress, setTrackProgress] = useState(true);
  const [frontSide, setFrontSide] = useState<FrontSideType>('zh');
  const [showSettings, setShowSettings] = useState(false);

  // Repetition state
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundCards, setRoundCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongCards, setWrongCards] = useState<FlashcardItem[]>([]);
  
  // View states
  const [isFinished, setIsFinished] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  
  // Undo history
  const [history, setHistory] = useState<{ card: FlashcardItem, action: 'correct' | 'wrong' }[]>([]);

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'left' | 'right' | null>(null);

  // Audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Khởi tạo vòng 1
  const initRound1 = useCallback(() => {
    const shuffled = [...initialCards].sort(() => Math.random() - 0.5);
    setRoundCards(shuffled);
    setCurrentIndex(0);
    setWrongCards([]);
    setRoundNumber(1);
    setIsFinished(false);
    setShowRoundSummary(false);
    setHistory([]);
    setIsFlipped(false);
    setSwipeAction(null);
  }, [initialCards]);

  useEffect(() => {
    initRound1();
  }, [initRound1]);

  // Handle action (✓ or ✕)
  const handleAction = useCallback((action: 'correct' | 'wrong') => {
    if (isFinished || showRoundSummary || roundCards.length === 0 || swipeAction) return;

    const currentCard = roundCards[currentIndex];
    
    // Bắt đầu animation
    setSwipeAction(action === 'wrong' ? 'left' : 'right');

    setTimeout(() => {
      // Lưu lịch sử để Undo
      setHistory(prev => [...prev, { card: currentCard, action }]);

      if (action === 'wrong' && trackProgress) {
        setWrongCards(prev => [...prev, currentCard]);
      }

      // Reset UI
      setIsFlipped(false);
      setSwipeAction(null);

      // Chuyển thẻ tiếp theo
      if (currentIndex < roundCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Hết thẻ vòng hiện tại
        if (trackProgress && wrongCards.length + (action === 'wrong' ? 1 : 0) > 0) {
          // Hiển thị màn hình tổng kết vòng
          setShowRoundSummary(true);
        } else {
          // Đã hoàn thành tất cả
          setIsFinished(true);
        }
      }
    }, 700); // Tăng thời gian chờ animation lên 700ms
  }, [currentIndex, isFinished, showRoundSummary, roundCards, trackProgress, wrongCards, swipeAction]);

  // Bắt đầu vòng mới
  const startNextRound = () => {
    const nextRoundCards = [...wrongCards];
    const shuffled = nextRoundCards.sort(() => Math.random() - 0.5);
    setRoundCards(shuffled);
    setCurrentIndex(0);
    setWrongCards([]);
    setRoundNumber(prev => prev + 1);
    setHistory([]); 
    setShowRoundSummary(false);
  };

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || currentIndex === 0 || swipeAction || showRoundSummary) return;

    const lastAction = history[history.length - 1];
    
    if (lastAction.action === 'wrong' && trackProgress) {
      setWrongCards(prev => prev.filter(c => c.id !== lastAction.card.id));
    }

    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setIsFlipped(false);
  }, [history, currentIndex, trackProgress, swipeAction, showRoundSummary]);

  // Shuffle current round manually
  const handleShuffleRound = () => {
    const unplayedCards = roundCards.slice(currentIndex);
    const shuffled = unplayedCards.sort(() => Math.random() - 0.5);
    const newRoundCards = [
      ...roundCards.slice(0, currentIndex),
      ...shuffled
    ];
    setRoundCards(newRoundCards);
  };

  // Bắt phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || showRoundSummary || isFinished) return;

      if (e.key === 'ArrowLeft') {
        handleAction('wrong');
      } else if (e.key === 'ArrowRight') {
        handleAction('correct');
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'Backspace') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, handleUndo, showSettings, showRoundSummary, isFinished]);

  // Audio Play
  const playAudio = (e: React.MouseEvent, url: string | null) => {
    e.stopPropagation();
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(err => console.error("Audio error", err));
  };

  if (initialCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-foreground/50 mb-4">Bài học này chưa có từ vựng hoặc câu mẫu nào.</p>
        <Link href={`/topics/${topicId}/lessons`} className="text-primary font-semibold hover:underline">
          Quay lại danh sách bài học
        </Link>
      </div>
    );
  }

  // --- MÀN HÌNH HOÀN THÀNH TẤT CẢ ---
  if (isFinished) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1A1814] shadow-sm">
          <div className="flex items-center gap-4">
            <Link href={`/topics/${topicId}/lessons`} className="text-[#A89C88] hover:text-[#C1272D] transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Thẻ ghi nhớ</h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in-up">
          <div className="text-[80px] mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-[#C1272D] mb-4">Hoàn thành xuất sắc!</h2>
          <p className="text-[#5C5446] dark:text-white/70 text-lg mb-10 text-center max-w-md">
            Bạn đã ôn tập xong tất cả {initialCards.length} thẻ ghi nhớ trong bài học này.
          </p>
          <div className="flex gap-4">
            <Link 
              href={`/topics/${topicId}/lessons`}
              className="px-6 py-3.5 bg-white dark:bg-white/5 text-[#5C5446] dark:text-white border-2 border-[#EFE4CE] dark:border-white/10 font-bold rounded-xl hover:bg-[#F6EFE0] transition-colors"
            >
              Quay lại danh sách
            </Link>
            <button 
              onClick={initRound1}
              className="px-6 py-3.5 bg-[#D4AF37] text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Ôn lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH TỔNG KẾT VÒNG (ROUND SUMMARY) ---
  if (showRoundSummary) {
    const knownCount = initialCards.length - wrongCards.length;
    const learningCount = wrongCards.length;
    const totalCount = initialCards.length;
    const percentKnown = Math.round((knownCount / totalCount) * 100) || 0;
    
    // Tính toán vòng tròn cho SVG
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentKnown / 100) * circumference;

    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-background">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4">
            <Link href={`/topics/${topicId}/lessons`} className="text-[#A89C88] hover:text-[#C1272D] transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Thẻ ghi nhớ</h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center p-6 sm:p-12 animate-fade-in-up">
          <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold text-[#2B2622] dark:text-white mb-12">
              Bạn đang làm rất tuyệt! Hãy tiếp tục để hoàn thành bài học
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Progress Section */}
              <div>
                <h3 className="text-lg font-bold text-[#7C7263] dark:text-white/60 mb-6">Tiến độ của bạn</h3>
                <div className="flex items-center gap-8">
                  {/* Circle Chart */}
                  <div className="relative w-[120px] h-[120px]">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#C1272D" strokeWidth="12" />
                      <circle 
                        cx="60" cy="60" r="50" fill="transparent" 
                        stroke="#D4AF37" strokeWidth="12" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-[#5C5446] dark:text-white">
                      {percentKnown}%
                    </div>
                  </div>

                  {/* Stats List */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#D4AF37]/10 rounded-xl font-bold">
                      <span className="text-[#D4AF37]">Đã biết</span>
                      <span className="text-[#D4AF37]">{knownCount}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#C1272D]/10 rounded-xl font-bold">
                      <span className="text-[#C1272D]">Đang học</span>
                      <span className="text-[#C1272D]">{learningCount}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl font-bold text-foreground/40">
                      <span>Còn lại</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div>
                <h3 className="text-lg font-bold text-[#7C7263] dark:text-white/60 mb-6">Bước tiếp theo</h3>
                <button 
                  onClick={startNextRound}
                  className="w-full flex items-center justify-center gap-3 bg-[#C1272D] hover:bg-[#A21E23] text-white font-bold text-lg p-5 rounded-2xl transition-all shadow-[0_6px_20px_rgba(193,39,45,0.3)] hover:-translate-y-0.5"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Ôn luyện với các câu hỏi
                </button>
                <div className="mt-4 text-center">
                  <p className="text-foreground/50 font-medium mb-6">
                    Tập trung vào học {learningCount} thẻ
                  </p>
                  <button onClick={initRound1} className="text-[#5C5446] dark:text-white/70 font-bold hover:underline">
                    Đặt lại Thẻ ghi nhớ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH HỌC (FLASHCARD) ---
  const currentCard = roundCards[currentIndex];
  if (!currentCard) return null;

  const isFrontZh = frontSide === 'zh';
  const displayFront = isFrontZh ? currentCard.front_zh : currentCard.back_vi;
  const displayBack = isFrontZh ? currentCard.back_vi : currentCard.front_zh;
  const pinyinBack = currentCard.front_py; // Pinyin luôn ở mặt sau (mặt giải nghĩa)

  // Tính toán class animation cho card
  let cardAnimationClass = "transition-all duration-700 ease-in-out";
  if (swipeAction === 'left') {
    cardAnimationClass += " -translate-x-full -rotate-12 opacity-0";
  } else if (swipeAction === 'right') {
    cardAnimationClass += " translate-x-full rotate-12 opacity-0";
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-[#1A1814] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10">
              <h3 className="text-xl font-bold">Tùy chọn</h3>
              <button onClick={() => setShowSettings(false)} className="text-foreground/50 hover:text-foreground">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theo dõi tiến độ */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-foreground mb-1">Theo dõi tiến độ</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    Sắp xếp thẻ ghi nhớ để theo dõi những gì bạn đã biết. Bật để lặp lại các thẻ chưa thuộc ở vòng sau.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={trackProgress} onChange={(e) => setTrackProgress(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C1272D]"></div>
                </label>
              </div>

              {/* Chiều lật */}
              <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-6">
                <h4 className="font-bold text-foreground">Mặt trước</h4>
                <select 
                  value={frontSide}
                  onChange={(e) => setFrontSide(e.target.value as FrontSideType)}
                  className="bg-black/5 dark:bg-white/10 text-foreground text-sm rounded-lg border-none outline-none px-4 py-2 font-medium cursor-pointer"
                >
                  <option value="zh">Tiếng Trung</option>
                  <option value="vi">Tiếng Việt</option>
                </select>
              </div>

              {/* Reset */}
              <div className="border-t border-black/5 dark:border-white/10 pt-6">
                <button 
                  onClick={() => {
                    initRound1();
                    setShowSettings(false);
                  }}
                  className="text-[#C1272D] font-bold hover:underline"
                >
                  Khởi động lại Thẻ ghi nhớ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 bg-[#FBF6EC] dark:bg-background">
        
        <div className="w-full max-w-[800px] flex flex-col items-center relative h-full justify-center">
          
          {/* Nút thoát */}
          <div className="absolute top-0 right-0 p-4">
            <Link href={`/topics/${topicId}/lessons`} className="p-2 bg-white dark:bg-white/10 rounded-full shadow-sm text-foreground/50 hover:text-foreground inline-block">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </Link>
          </div>

          {/* Card Container */}
          <div 
            className={`relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[60vh] cursor-pointer group [perspective:1000px] ${cardAnimationClass}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Lớp overlay text (Chưa thuộc / Đã thuộc) khi đang vuốt */}
            {swipeAction && (
              <div className={`absolute inset-0 z-20 flex items-center justify-center rounded-[24px] pointer-events-none transition-opacity duration-300 ${swipeAction === 'left' ? 'bg-[#FF9800]/10' : 'bg-[#4CAF50]/10'}`}>
                <div className={`text-4xl font-black uppercase tracking-wider px-8 py-3 rounded-2xl border-4 ${swipeAction === 'left' ? 'text-[#FF9800] border-[#FF9800] rotate-[-15deg]' : 'text-[#4CAF50] border-[#4CAF50] rotate-[15deg]'}`}>
                  {swipeAction === 'left' ? 'Chưa thuộc' : 'Đã thuộc'}
                </div>
              </div>
            )}

            {/* 3D Box */}
            <div 
              className="w-full h-full relative duration-500 ease-in-out [transform-style:preserve-3d]"
              style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
            >
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full bg-white dark:bg-[#25221c] rounded-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] dark:shadow-none border border-black/5 dark:border-white/5 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
                {/* Audio Icon */}
                {currentCard.audio_url && (
                  <button 
                    onClick={(e) => playAudio(e, currentCard.audio_url)}
                    className="absolute top-6 right-6 p-3 text-[#A89C88] hover:text-[#C1272D] hover:bg-black/5 rounded-full transition-colors z-10"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
                )}
                {/* Content */}
                <div className="text-center w-full px-4">
                  <div className={`font-bold text-[#2B2622] dark:text-white ${currentCard.type === 'pattern' ? 'text-3xl sm:text-5xl leading-tight' : 'text-5xl sm:text-[80px]'}`}>
                    {displayFront}
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 w-full h-full bg-[#FFFDF8] dark:bg-[#1f1d18] rounded-[24px] shadow-[0_10px_30px_rgba(120,90,40,0.06)] border border-[#EFE4CE] dark:border-white/5 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]"
                style={{ transform: 'rotateX(180deg)' }}
              >
                {/* Audio Icon */}
                {currentCard.audio_url && (
                  <button 
                    onClick={(e) => playAudio(e, currentCard.audio_url)}
                    className="absolute top-6 right-6 p-3 text-[#A89C88] hover:text-[#C1272D] hover:bg-black/5 rounded-full transition-colors z-10"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
                )}
                <div className="text-center w-full px-4">
                  <div className={`font-bold text-[#C1272D] ${currentCard.type === 'pattern' ? 'text-2xl sm:text-4xl leading-relaxed' : 'text-4xl sm:text-[60px]'} mb-6`}>
                    {displayBack}
                  </div>
                  {pinyinBack && <div className="text-xl sm:text-2xl text-[#8A8071] font-medium border-t border-[#EFE4CE] dark:border-white/10 pt-4 max-w-[80%] mx-auto">{pinyinBack}</div>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Action Bar (Cố định ở dưới cùng) */}
      <div className="w-full bg-[#F3F4F6] dark:bg-[#1f1d18] flex items-center justify-between px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-black/5 dark:border-white/5">
        
        {/* Phần 1: Theo dõi tiến độ */}
        <div className="hidden md:flex items-center gap-3 w-1/4">
          <span className="font-bold text-[#C1272D] whitespace-nowrap">Theo dõi tiến độ</span>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={trackProgress} onChange={(e) => setTrackProgress(e.target.checked)} />
            <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C1272D]"></div>
          </label>
        </div>

        {/* Phần 2: Cụm điều khiển chính (✕, Counter, ✓) */}
        <div className="flex-1 flex justify-center items-center gap-6 sm:gap-10">
          <button 
            onClick={() => handleAction('wrong')}
            disabled={swipeAction !== null}
            className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-white dark:bg-[#2A2A2A] border border-black/5 shadow-sm hover:shadow-md flex items-center justify-center text-[#D97706] hover:bg-[#FFFBEB] transition-all disabled:opacity-50"
            title="Chưa thuộc (Phím mũi tên trái)"
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="text-xl font-bold text-[#4B5563] dark:text-white w-[100px] text-center tracking-wider">
            {currentIndex + 1} / {roundCards.length}
          </div>

          <button 
            onClick={() => handleAction('correct')}
            disabled={swipeAction !== null}
            className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-white dark:bg-[#2A2A2A] border border-black/5 shadow-sm hover:shadow-md flex items-center justify-center text-[#10B981] hover:bg-[#ECFDF5] transition-all disabled:opacity-50"
            title="Đã thuộc (Phím mũi tên phải)"
          >
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>

        {/* Phần 3: Các công cụ phụ */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-1/4">
          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Hoàn tác"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>

          <button 
            onClick={handleShuffleRound}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Xáo trộn"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Tùy chọn"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}
