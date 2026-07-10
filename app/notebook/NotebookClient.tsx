"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MarkdownEditor = dynamic(() => import("./MarkdownEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] border border-[#E8C55A]/50 rounded-lg bg-gray-50 dark:bg-white/5 animate-pulse flex items-center justify-center text-sm text-gray-400">Đang tải editor...</div>
});

type NotebookEntry = {
  id: string;
  title: string;
  answer: string;
  created_at: string;
};

export default function NotebookClient() {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", answer: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/notebook", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEntries(json.data);
      }
    } catch (error) {
      console.error("Lỗi fetch notebook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      setDeletingId(id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/notebook/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      const json = await res.json();
      if (json.success) {
        setEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        alert("Xóa thất bại: " + json.error);
      }
    } catch (error: any) {
      alert("Lỗi khi xóa: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditStart = (entry: NotebookEntry) => {
    setEditingEntryId(entry.id);
    setEditForm({
      title: entry.title,
      answer: entry.answer,
    });
    setExpandedId(entry.id); // Đảm bảo đang mở chi tiết
  };

  const handleEditCancel = () => {
    setEditingEntryId(null);
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.title.trim() || !editForm.answer.trim()) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/notebook/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(editForm)
      });
      
      const json = await res.json();
      if (json.success) {
        setEntries(prev => prev.map(entry => 
          entry.id === id 
            ? { ...entry, title: editForm.title, answer: editForm.answer }
            : entry
        ));
        setEditingEntryId(null);
      } else {
        alert("Cập nhật thất bại: " + json.error);
      }
    } catch (error: any) {
      alert("Lỗi khi cập nhật: " + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-[#FFFDF8] dark:bg-[#1A1814] rounded-2xl border border-[#EFE4CE] dark:border-white/10 shadow-sm animate-fade-in-up">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-[#C1272D] mb-2">Sổ tay trống</h3>
        <p className="text-[#5C5446] dark:text-white/60 mb-6">
          Chưa có ghi chú nào. Hãy lưu các câu trả lời hữu ích từ Trợ lý AI nhé!
        </p>
        <Link 
          href="/assistant"
          className="inline-block px-6 py-2.5 bg-[#C1272D] hover:bg-[#a62025] text-white font-medium rounded-full transition-colors shadow-sm"
        >
          Đến Trợ lý AI
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {entries.map(entry => (
        <div 
          key={entry.id} 
          className="bg-[#FFFDF8] dark:bg-[#1A1814] rounded-2xl border border-[#EFE4CE] dark:border-white/10 shadow-sm overflow-hidden transition-all hover:border-[#D4AF37]/50"
        >
          <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              {editingEntryId === entry.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1 block">Tiêu đề</label>
                    <input 
                      type="text" 
                      value={editForm.title}
                      onChange={e => setEditForm(prev => ({...prev, title: e.target.value}))}
                      className="w-full text-lg font-bold text-[#C1272D] p-2 border border-[#E8C55A]/50 rounded-lg focus:outline-none focus:border-[#b58c14] bg-white dark:bg-black/20"
                      disabled={isSavingEdit}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1 block">Nội dung</label>
                    <MarkdownEditor 
                      markdown={editForm.answer}
                      onChange={(markdown) => setEditForm(prev => ({...prev, answer: markdown}))}
                      disabled={isSavingEdit}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={handleEditCancel}
                      disabled={isSavingEdit}
                      className="text-sm font-medium px-4 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={() => handleEditSave(entry.id)}
                      disabled={isSavingEdit}
                      className="text-sm font-medium px-4 py-1.5 bg-[#C1272D] text-white hover:bg-[#a62025] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-[#C1272D] mb-1">{entry.title}</h3>
                  <p className="text-xs text-[#5C5446]/70 dark:text-white/50 mb-3 flex items-center gap-1">
                    <span>🗓️</span> {formatDate(entry.created_at)}
                  </p>
                  
                  {expandedId !== entry.id ? (
                    <div className="text-sm text-[#2B2622]/80 dark:text-white/80 line-clamp-2">
                      <ReactMarkdown>{entry.answer}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-[#EFE4CE] dark:border-white/10">
                      <div>
                        <div className="markdown-body text-sm bg-white dark:bg-black/20 p-4 rounded-xl border border-[#EFE4CE] dark:border-white/5 leading-relaxed">
                          <ReactMarkdown
                            components={{
                              h3: ({ node, ...props }) => (
                                <h3 className="text-lg font-bold text-[#C1272D] mt-3 mb-1 first:mt-0" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                              ),
                              hr: ({ node, ...props }) => <hr className="my-3 border-t border-gray-200 dark:border-gray-800" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            }}
                          >
                            {entry.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {editingEntryId !== entry.id && (
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button 
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="text-sm font-medium px-4 py-1.5 bg-[#fef7e6] dark:bg-white/5 border border-[#E8C55A]/50 text-[#b58c14] hover:bg-[#E8C55A]/20 rounded-lg transition-colors"
                >
                  {expandedId === entry.id ? "Thu gọn" : "Xem chi tiết"}
                </button>
                <div className="flex gap-1 mt-1 sm:mt-2">
                  <button 
                    onClick={() => handleEditStart(entry)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Sửa ghi chú"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Xóa ghi chú"
                  >
                    {deletingId === entry.id ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
