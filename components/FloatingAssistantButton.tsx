"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AssistantChat from "./AssistantChat";

export default function FloatingAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide the assistant on specific practice mode pages
  if (pathname.includes('/shadowing') || pathname.includes('/translation') || pathname.includes('/flashcard')) {
    return null;
  }

  return (
    <>
      {/* Nút tròn nổi (khi đóng) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#C1272D] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(193,39,45,0.39)] hover:bg-[#a62025] hover:shadow-[0_6px_20px_rgba(193,39,45,0.23)] hover:scale-105 transition-all duration-300 z-50 ${
          isOpen ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0"
        }`}
        aria-label="Mở trợ lý"
      >
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Popup chứa khung chat */}
      <div 
        className={`fixed bottom-6 right-6 w-[92vw] max-w-[400px] z-50 transition-all duration-300 transform origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative shadow-2xl rounded-xl">
          {/* Nút đóng (X) */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2.5 right-3 z-10 p-1.5 text-white/80 hover:text-white hover:bg-black/10 rounded-full transition-colors"
            aria-label="Đóng trợ lý"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <AssistantChat variant="compact" />
        </div>
      </div>
    </>
  );
}
