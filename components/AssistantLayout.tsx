"use client";
import React, { useState, useEffect } from "react";
import AssistantChat from "./AssistantChat";
import { supabase } from "@/lib/supabase";

export default function AssistantLayout() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const response = await fetch("/api/chat-sessions", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setSessions(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsSidebarOpen(false);
  };

  const handleSessionCreated = (id: string) => {
    setCurrentSessionId(id);
    fetchSessions(); // Tải lại danh sách sidebar để cập nhật tiêu đề/ngày
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/chat-sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(null);
        }
      } else {
        alert("Xóa thất bại: " + json.error);
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi xóa");
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-[#FFFFF0]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-50 h-full w-[280px] bg-white border-r border-[#D4AF37]/30 flex flex-col transition-transform duration-300 shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-[#D4AF37]/30 shrink-0">
          <button 
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 bg-[#fef7e6] hover:bg-[#E8C55A]/20 border border-[#E8C55A]/50 text-[#b58c14] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl leading-none mb-0.5">+</span>
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-gray-400 mt-6 italic">Chưa có phiên nào</div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="relative group">
                <button
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 pr-8 rounded-lg transition-colors flex flex-col gap-0.5 ${
                    currentSessionId === s.id 
                      ? 'bg-[#C1272D]/10 border border-[#C1272D]/20 shadow-sm' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`font-medium truncate text-sm ${currentSessionId === s.id ? 'text-[#C1272D]' : 'text-gray-700'}`}>
                    {s.title}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {formatDate(s.updated_at)}
                  </div>
                </button>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                  title="Xóa phiên chat"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full w-full min-w-0">
        <AssistantChat 
          variant="full" 
          sessionId={currentSessionId} 
          onSessionCreated={handleSessionCreated} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
