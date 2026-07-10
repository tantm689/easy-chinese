import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Không tìm thấy token xác thực" },
        { status: 401 }
      );
    }

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

    if (authError || !user) {
      return NextResponse.json(
        { error: "Xác thực thất bại hoặc session đã hết hạn" },
        { status: 401 }
      );
    }

    // Lấy lịch sử chat của session id cụ thể
    // RLS sẽ tự động block nếu session đó không thuộc về user hiện tại
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Lỗi lấy lịch sử chat:", error);
      return NextResponse.json(
        { error: error.message || "Không thể lấy lịch sử trò chuyện" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("API GET /chat-sessions/[id] lỗi:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Không tìm thấy token xác thực" },
        { status: 401 }
      );
    }

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

    if (authError || !user) {
      return NextResponse.json(
        { error: "Xác thực thất bại hoặc session đã hết hạn" },
        { status: 401 }
      );
    }

    // Xoá session (RLS đảm bảo chỉ user_id của chính họ mới xoá được)
    const { data, error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id) // thêm eq(user.id) để double check
      .select();

    if (error) {
      console.error("Lỗi xoá chat session:", error);
      return NextResponse.json(
        { error: error.message || "Không thể xoá phiên trò chuyện" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên trò chuyện hoặc bạn không có quyền xoá" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Đã xoá phiên trò chuyện" }, { status: 200 });
  } catch (error: any) {
    console.error("API DELETE /chat-sessions/[id] lỗi:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
