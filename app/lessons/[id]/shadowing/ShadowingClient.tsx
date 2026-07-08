"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Lesson, DialogueSentence } from "@/lib/queries";
import PronunciationCheck from "@/components/PronunciationCheck";

export default function ShadowingClient({
  lesson,
  sentences,
}: {
  lesson: Lesson;
  sentences: DialogueSentence[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPause, setIsAutoPause] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [status, setStatus] = useState<'idle' | 'playing' | 'recording'>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [autoPlayPending, setAutoPlayPending] = useState(false);
  const [seekPending, setSeekPending] = useState<number | null>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Global durations
  const [durations, setDurations] = useState<number[]>(sentences.map(() => 0));
  const [totalDuration, setTotalDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recordedAudioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentSentence = sentences[currentIndex];

  // Load all durations once for the global progress bar
  useEffect(() => {
    let mounted = true;
    const loadDurations = async () => {
      const durs = await Promise.all(sentences.map(s => {
        return new Promise<number>((resolve) => {
          if (!s.audio_url) return resolve(0);
          const audio = new Audio(s.audio_url);
          audio.onloadedmetadata = () => resolve(audio.duration);
          audio.onerror = () => resolve(0);
        });
      }));
      if (mounted) {
        setDurations(durs);
        setTotalDuration(durs.reduce((a, b) => a + b, 0));
      }
    };
    loadDurations();
    return () => { mounted = false };
  }, [sentences]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentIndex]);

  // Auto-scroll to current sentence
  useEffect(() => {
    if (sentenceRefs.current[currentIndex]) {
      sentenceRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  // Handle auto-play when automatically advancing or seeking
  useEffect(() => {
    if (autoPlayPending && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setStatus('playing');
            setAutoPlayPending(false);
          })
          .catch((err) => {
            console.error("Auto-play error:", err);
            setAutoPlayPending(false);
            setStatus('idle');
          });
      }
    }
  }, [currentIndex, autoPlayPending]);

  // Handle setting time when seeking across sentences
  useEffect(() => {
    if (seekPending !== null && audioRef.current && audioDuration > 0) {
      audioRef.current.currentTime = seekPending;
      setAudioProgress(seekPending);
      setSeekPending(null);
      if (status === 'playing') {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, seekPending, audioDuration, status]);

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      // Fallback update duration if global loading failed for this one
      setDurations(prev => {
        const newDurs = [...prev];
        if (newDurs[currentIndex] === 0) {
          newDurs[currentIndex] = audioRef.current!.duration;
          setTotalDuration(newDurs.reduce((a, b) => a + b, 0));
        }
        return newDurs;
      });
    }
  };

  const clearRecorded = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
  };

  const handleAudioEnded = () => {
    setHasPlayedOnce(true);
    if (!isAutoPause) {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(c => c + 1);
        setAudioProgress(0);
        setHasPlayedOnce(false);
        setAutoPlayPending(true);
      } else {
        setStatus('idle');
      }
    } else {
      setStatus('idle');
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (status === 'playing') {
        audioRef.current.pause();
        setStatus('idle');
      } else {
        if (hasPlayedOnce && currentIndex < sentences.length - 1) {
          goNextSentence(true);
        } else {
          if (hasPlayedOnce) {
            audioRef.current.currentTime = 0;
            setHasPlayedOnce(false);
          }
          audioRef.current.play();
          setStatus('playing');
        }
      }
    }
  };

  const handleGlobalSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetGlobalTime = Number(e.target.value);
    
    let accumulated = 0;
    let targetIndex = 0;
    let localTime = 0;

    for (let i = 0; i < durations.length; i++) {
      if (accumulated + durations[i] >= targetGlobalTime) {
        targetIndex = i;
        localTime = targetGlobalTime - accumulated;
        break;
      }
      accumulated += durations[i];
    }
    
    // If it reached the end (floating point edge case)
    if (targetIndex === 0 && targetGlobalTime >= totalDuration && totalDuration > 0) {
      targetIndex = durations.length - 1;
      localTime = durations[durations.length - 1];
    }

    if (targetIndex !== currentIndex) {
      setCurrentIndex(targetIndex);
      setSeekPending(localTime);
      setHasPlayedOnce(false);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = localTime;
        setAudioProgress(localTime);
        if (localTime < audioDuration) {
          setHasPlayedOnce(false);
        }
      }
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 0.75 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionError(false);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      console.error("Microphone permission denied", err);
      setPermissionError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('idle');
    }
  };

  const playRecorded = () => {
    if (recordedAudioRef.current && recordedUrl) {
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current.play();
    }
  };

  const handleReplay = () => {
    // Luôn phát lại từ đầu toàn bài khóa
    setCurrentIndex(0);
    setAudioProgress(0);
    setHasPlayedOnce(false);
    setAutoPlayPending(true);
  };

  const goNextSentence = (autoPlay = true) => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(c => c + 1);
      setAudioProgress(0);
      setHasPlayedOnce(false);
      setAutoPlayPending(true);
    }
  };

  const goPrevSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setAudioProgress(0);
      setHasPlayedOnce(false);
      setAutoPlayPending(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate global time for the progress bar
  const globalCurrentTime = durations.slice(0, currentIndex).reduce((a, b) => a + b, 0) + audioProgress;

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Hidden Audios */}
      {currentSentence.audio_url && (
        <audio 
          ref={audioRef} 
          src={currentSentence.audio_url} 
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="auto" 
        />
      )}
      {recordedUrl && (
        <audio ref={recordedAudioRef} src={recordedUrl} />
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-[#1a1814]/95 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col">
          
          {/* NHÓM 1: Phát audio mẫu (Tông Đỏ) */}
          <div className="px-4 py-4 md:py-5 flex flex-col gap-4">
            
            <div className="flex items-center gap-3">
              <Link href={`/topics/${lesson.topic_id}/lessons`} className="text-foreground/70 hover:text-[#C1272D] transition-colors p-2 -ml-2 rounded-full hover:bg-[#C1272D]/5 flex-shrink-0">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <h1 className="font-bold text-lg text-foreground line-clamp-1">Shadowing: {lesson.title}</h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Play/Pause & Progress */}
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-[#C1272D] text-white flex items-center justify-center hover:bg-[#A21E23] transition-transform hover:scale-105 active:scale-95 shrink-0 shadow-md"
                >
                  {status === 'playing' ? (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
                  ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="ml-1"><path d="M5 3v18l15-9L5 3z" /></svg>
                  )}
                </button>

                <div className="text-sm font-semibold text-foreground/60 w-[85px] shrink-0 tabular-nums">
                  {formatTime(globalCurrentTime)} / {formatTime(totalDuration)}
                </div>

                <input 
                  type="range" 
                  min={0} 
                  max={totalDuration || 100} 
                  value={globalCurrentTime}
                  onChange={handleGlobalSeek}
                  className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C1272D]"
                />
              </div>

              {/* Right Controls */}
              <div className="flex items-center justify-between md:justify-end gap-5">
                
                {/* Subtle Prev, Replay, Next group */}
                <div className="flex items-center gap-4 text-foreground/40">
                  <button 
                    onClick={goPrevSentence} 
                    disabled={currentIndex === 0} 
                    className="hover:text-[#C1272D] transition-colors disabled:opacity-30 disabled:hover:text-foreground/40"
                    title="Câu trước"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                  </button>

                  <button 
                    onClick={handleReplay} 
                    disabled={!isAutoPause && !(currentIndex === sentences.length - 1 && hasPlayedOnce)}
                    className="hover:text-[#C1272D] transition-colors disabled:opacity-30 disabled:hover:text-foreground/40" 
                    title="Phát lại toàn bài"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
                  </button>

                  <button 
                    onClick={() => goNextSentence(false)} 
                    disabled={currentIndex === sentences.length - 1} 
                    className="hover:text-[#C1272D] transition-colors disabled:opacity-30 disabled:hover:text-foreground/40"
                    title="Câu sau"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                  </button>
                </div>

                <button 
                  onClick={toggleSpeed}
                  className="font-bold text-foreground/50 hover:text-[#C1272D] transition-colors w-8 text-center text-sm"
                  title="Tốc độ phát"
                >
                  {playbackRate}x
                </button>

                <div className="w-px h-5 bg-black/10 dark:bg-white/10 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground/70 cursor-pointer select-none hidden sm:inline" onClick={() => setIsAutoPause(!isAutoPause)}>
                    Tự động dừng
                  </span>
                  <button 
                    onClick={() => setIsAutoPause(!isAutoPause)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoPause ? 'bg-[#C1272D]' : 'bg-black/20 dark:bg-white/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoPause ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NHÓM 2: Luyện tập (Tông Vàng Ánh Kim) - To, Rõ, Căn giữa */}
          <div className="px-4 py-4 flex justify-center items-center gap-6">
            
            <button 
              onClick={playRecorded}
              disabled={!recordedUrl}
              className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide border-2 transition-all w-full sm:w-auto ${
                recordedUrl 
                  ? "bg-white dark:bg-[#1a1814] border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/5 hover:-translate-y-0.5" 
                  : "bg-transparent border-black/5 dark:border-white/5 text-foreground/30 cursor-not-allowed"
              }`}
            >
              <span className={`text-xl ${!recordedUrl && "grayscale opacity-50"}`}>▶️</span> PHÁT LẠI GHI ÂM
            </button>

            {status === 'recording' ? (
              <button 
                onClick={stopRecording}
                className="flex items-center justify-center gap-3 bg-red-500 text-white px-10 py-3.5 rounded-2xl font-bold text-sm tracking-wide hover:bg-red-600 transition-all animate-pulse w-full sm:w-auto"
              >
                <span className="w-4 h-4 bg-white rounded-sm"></span> DỪNG GHI ÂM
              </button>
            ) : (
              <button 
                onClick={startRecording}
                className="flex items-center justify-center gap-3 bg-[#D4AF37] text-white px-10 py-3.5 rounded-2xl font-bold text-sm tracking-wide hover:bg-[#B3932F] transition-all hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <span className="text-xl">🎙️</span> GHI ÂM
              </button>
            )}
            
            <PronunciationCheck 
              targetText={currentSentence.chinese_text}
              buttonLabel={<><span className="text-xl">🎤</span> LUYỆN PHÁT ÂM</>}
              buttonClassName="!px-10 !py-3.5 !rounded-2xl !font-bold !tracking-wide hover:-translate-y-0.5 w-full sm:w-auto"
            />
            
          </div>

        </div>
      </div>

      {/* Permission Error */}
      {permissionError && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-6">
          <div className="bg-[#C1272D]/10 border border-[#C1272D]/20 text-[#C1272D] p-4 rounded-xl text-center text-sm font-medium">
            Không thể truy cập Micro. Vui lòng cấp quyền sử dụng Micro trong cài đặt trình duyệt của bạn để ghi âm.
          </div>
        </div>
      )}

      {/* Vertical Transcript List */}
      <div className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-6">
        {sentences.map((s, idx) => {
          const isCurrent = idx === currentIndex;
          
          return (
            <div 
              key={s.id}
              ref={el => { sentenceRefs.current[idx] = el; }}
              className={`flex flex-col p-6 md:p-10 rounded-3xl transition-all duration-500 border-2 ${
                isCurrent 
                  ? 'bg-white dark:bg-[#25221c] border-[#C1272D]/20 scale-[1.01]' 
                  : 'bg-white/40 dark:bg-[#25221c]/40 border-black/5 dark:border-white/5 opacity-50 hover:opacity-80 cursor-pointer'
              }`}
              onClick={() => {
                if (!isCurrent) {
                  clearRecorded();
                  setCurrentIndex(idx);
                  setAutoPlayPending(true);
                  setStatus('idle');
                }
              }}
            >
              {/* Text Display */}
              <div className="text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-[1.5] tracking-wide mb-4">
                  {s.chinese_text}
                </h2>
                <p className="text-xl md:text-2xl text-[#D4AF37] font-medium mb-4 tracking-wider">
                  {s.pinyin}
                </p>
                <p className={`text-lg transition-colors ${isCurrent ? 'text-foreground/80' : 'text-foreground/50'}`}>
                  {s.vietnamese_text}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  );
}
