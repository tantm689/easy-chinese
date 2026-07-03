"use client";

export default function PlayAudioButton({ url }: { url: string | null }) {
  // Nếu chưa có file âm thanh thì tạm thời render nút mờ đi để giữ layout
  if (!url) {
    return (
      <button 
        disabled
        className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-foreground/20 cursor-not-allowed"
        title="Chưa có audio"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    );
  }

  const playAudio = () => {
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <button 
      onClick={playAudio}
      className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors hover:shadow-md"
      title="Nghe phát âm"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
