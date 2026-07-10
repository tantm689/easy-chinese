"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface AssistantChatProps {
  variant?: "full" | "compact";
  sessionId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
  onOpenSidebar?: () => void;
}

export default function AssistantChat({ 
  variant = "full", 
  sessionId, 
  onSessionCreated, 
  onOpenSidebar 
}: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedMessages, setSavedMessages] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<{ index: number; message: string } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [localSessionId, setLocalSessionId] = useState<string | null>(sessionId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync prop with local state
  useEffect(() => {
    if (sessionId !== undefined) {
      setLocalSessionId(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setIsLoadingHistory(false);
          return;
        }

        let targetSessionId = sessionId !== undefined ? sessionId : localSessionId;

        // Đã gỡ bỏ logic tự động lấy phiên cũ cho chế độ compact theo yêu cầu mới.
        // Chế độ compact sẽ luôn bắt đầu với 1 phiên chat mới.

        if (!targetSessionId) {
          setMessages([]);
          setIsLoadingHistory(false);
          return;
        }

        const response = await fetch(`/api/chat-sessions/${targetSessionId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            const formattedMessages: Message[] = json.data.map((item: any) => ({
              role: item.role,
              content: item.content
            }));
            setMessages(formattedMessages);
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử chat:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId]); // Lắng nghe thay đổi của prop sessionId thay vì chạy 1 lần

  const startSaveProcess = (index: number) => {
    // Generate a default title from the assistant's answer or just use a default string
    let defaultTitle = "Ghi chú từ Trợ lý";
    const answer = messages[index]?.content;
    if (answer) {
      // Get first sentence or 50 chars of answer
      const firstLine = answer.split('\n')[0].replace(/[#*]/g, '').trim();
      defaultTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? "..." : "");
    }
    
    setEditTitle(defaultTitle);
    setEditingTitleIndex(index);
    setSaveError(null);
  };

  const handleConfirmSave = async (answer: string, index: number) => {
    if (!editTitle.trim()) return;
    
    try {
      setSavingIndex(index);
      setSaveError(null);

      // Lấy token để gọi API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSaveError({ index, message: "Vui lòng đăng nhập để lưu vào sổ tay!" });
        return;
      }

      const response = await fetch("/api/notebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: editTitle,
          answer
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi lưu");
      }

      setSavedMessages(prev => new Set(prev).add(index));
      setEditingTitleIndex(null);
    } catch (err: any) {
      console.error(err);
      setSaveError({ index, message: err.message || "Đã xảy ra lỗi" });
    } finally {
      setSavingIndex(null);
    }
  };

  // Tự động cuộn xuống cuối mỗi khi có tin nhắn mới hoặc đang loading
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Cập nhật UI ngay lập tức với tin nhắn của user
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const targetSessionId = sessionId !== undefined ? sessionId : localSessionId;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ question: userMessage, sessionId: targetSessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi phản hồi từ máy chủ");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      
      // Nếu có sessionId mới trả về (tức là vừa tạo phiên mới)
      if (data.sessionId && data.sessionId !== localSessionId) {
        setLocalSessionId(data.sessionId);
        onSessionCreated?.(data.sessionId);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API assistant:", error);
      // Hiển thị thông báo lỗi thân thiện thay vì làm crash app
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý câu hỏi. Bạn thử lại nhé!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Xác định class cho container dựa vào variant
  const containerClasses =
    variant === "full"
      ? "flex flex-col h-full w-full bg-[#FFFFF0]"
      : "flex flex-col w-full h-[500px] max-h-screen border border-[#D4AF37]/40 rounded-xl overflow-hidden shadow-xl bg-[#FFFFF0]";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-[#C1272D] text-white px-4 py-3 shadow-sm flex items-center shrink-0">
        {onOpenSidebar && (
          <button 
            onClick={onOpenSidebar} 
            className="mr-3 md:hidden text-white/90 hover:text-white p-1 -ml-2 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h3 className="font-semibold tracking-wide">Trợ lý Tiếng Trung</h3>
      </div>

      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 italic">Đang tải lịch sử...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-[#fef7e6] rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-[#b58c14] font-medium mb-2">Xin chào!</p>
            <p className="text-gray-500 text-sm italic max-w-xs leading-relaxed">
              Hỏi tôi bất cứ điều gì về ngữ pháp hoặc từ vựng tiếng Trung nhé! Tôi luôn sẵn sàng hỗ trợ bạn.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-[#C1272D] text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-[#D4AF37] rounded-bl-sm leading-relaxed"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-bold text-[#C1272D] mt-3 mb-1 first:mt-0" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-gray-900" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                      ),
                      li: ({ node, ...props }) => <li className="text-gray-800" {...props} />,
                      hr: ({ node, ...props }) => <hr className="my-3 border-t border-gray-200" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  
                  {/* Nút lưu sổ tay */}
                  <div className="mt-3 flex justify-end flex-col items-end gap-2">
                    {editingTitleIndex === idx ? (
                      <div className="flex flex-col gap-2 w-full max-w-sm bg-[#fef7e6] p-2.5 rounded-lg border border-[#E8C55A]/50">
                        <label className="text-xs text-[#b58c14] font-medium">Tiêu đề lưu (có thể sửa):</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="text-sm px-2.5 py-1.5 rounded-md border border-[#E8C55A]/50 focus:outline-none focus:border-[#b58c14] bg-white w-full"
                          autoFocus
                          disabled={savingIndex === idx}
                        />
                        {saveError?.index === idx && (
                          <span className="text-xs text-[#C1272D]">{saveError.message}</span>
                        )}
                        <div className="flex justify-end gap-2 mt-1">
                          <button
                            onClick={() => setEditingTitleIndex(null)}
                            disabled={savingIndex === idx}
                            className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              handleConfirmSave(msg.content, idx);
                            }}
                            disabled={savingIndex === idx || !editTitle.trim()}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-[#C1272D] text-white hover:bg-[#a62025] rounded-md transition-all disabled:opacity-50"
                          >
                            {savingIndex === idx ? "Đang lưu..." : "Xác nhận lưu"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          startSaveProcess(idx);
                        }}
                        disabled={savedMessages.has(idx)}
                        className={`text-xs flex items-center gap-1.5 px-3 py-1.5 border rounded-full transition-all ${
                          savedMessages.has(idx)
                            ? "bg-[#e8f5e9] border-[#a5d6a7] text-[#2e7d32] cursor-not-allowed opacity-80"
                            : "bg-[#fef7e6] border-[#E8C55A]/50 text-[#b58c14] hover:bg-[#E8C55A]/20 hover:text-[#9e7a11] hover:border-[#E8C55A]"
                        }`}
                        title="Lưu câu trả lời này vào Sổ tay để xem lại"
                      >
                        {savedMessages.has(idx) ? (
                          <>
                            <span>✓</span> Đã lưu
                          </>
                        ) : (
                          <>
                            <span>🔖</span> Lưu Sổ tay
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
          </>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-gray-500 border border-[#D4AF37] rounded-bl-none shadow-sm flex items-center gap-2">
              <span className="animate-pulse">Đang trả lời...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Khu vực input nhập liệu */}
      <div className="p-3 bg-white border-t border-[#D4AF37]/30 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-[#FFFFF0] border border-[#D4AF37]/50 rounded-full focus:outline-none focus:border-[#C1272D] focus:ring-1 focus:ring-[#C1272D] transition-colors text-gray-800 placeholder-gray-400"
            placeholder="Nhập câu hỏi của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-[#C1272D] hover:bg-[#a62025] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
