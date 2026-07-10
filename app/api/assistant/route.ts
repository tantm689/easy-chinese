import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, sessionId: reqSessionId } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Vui lòng cung cấp câu hỏi (question) hợp lệ." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Thiếu cấu hình GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: question,
      config: {
        systemInstruction: "Bạn là trợ lý giải đáp tiếng Trung cho người Việt học HSK 1-3. Hãy trả lời ngắn gọn, có ví dụ minh hoạ kèm pinyin khi giải thích ngữ pháp hoặc từ vựng. Yêu cầu: KHÔNG sử dụng ký hiệu định dạng toán học hay LaTeX (ví dụ: tuyệt đối không dùng $\\rightarrow$ mà hãy dùng ký tự mũi tên thường như '->' hoặc '→').",
      }
    });

    // Xoá các định dạng LaTeX không mong muốn phòng khi model vẫn sinh ra
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/\$\s*\\rightarrow\s*\$/g, "→");
    cleanText = cleanText.replace(/\$\s*\\Rightarrow\s*\$/g, "⇒");

    // LƯU LỊCH SỬ CHAT
    let finalSessionId = reqSessionId;

    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!authError && user) {
          // Nếu chưa có session, tạo mới
          if (!finalSessionId) {
            let title = question;
            if (title.length > 50) {
              title = title.substring(0, 50) + "...";
            }
            
            const { data: newSession, error: createSessionError } = await supabase
              .from("chat_sessions")
              .insert([{ user_id: user.id, title }])
              .select("id")
              .single();
              
            if (!createSessionError && newSession) {
              finalSessionId = newSession.id;
            }
          }

          if (finalSessionId) {
            // Cập nhật updated_at
            await supabase
              .from("chat_sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", finalSessionId);

            // Lưu tin nhắn user và assistant
            await supabase.from("chat_history").insert([
              { session_id: finalSessionId, role: "user", content: question },
              { session_id: finalSessionId, role: "assistant", content: cleanText }
            ]);

            // Giữ tối đa 30 dòng cho session này
            const { data: history } = await supabase
              .from("chat_history")
              .select("id")
              .eq("session_id", finalSessionId)
              .order("created_at", { ascending: false });

            if (history && history.length > 30) {
              const idsToDelete = history.slice(30).map(h => h.id);
              await supabase
                .from("chat_history")
                .delete()
                .in("id", idsToDelete);
            }
            
            // Giữ tối đa 15 sessions cho user này
            const { data: sessions } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false });
              
            if (sessions && sessions.length > 15) {
              const sessionIdsToDelete = sessions.slice(15).map(s => s.id);
              await supabase
                .from("chat_sessions")
                .delete()
                .in("id", sessionIdsToDelete);
            }
          }
        }
      }
    } catch (saveError) {
      console.error("Lỗi khi lưu lịch sử chat (không ảnh hưởng response):", saveError);
    }

    return NextResponse.json({ answer: cleanText, sessionId: finalSessionId });
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn." },
      { status: 500 }
    );
  }
}
