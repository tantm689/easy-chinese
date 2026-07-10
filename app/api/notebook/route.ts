import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Không tìm thấy token xác thực" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, answer } = body;

    if (!title || !answer) {
      return NextResponse.json(
        { error: "Thiếu thông tin (title, answer)" },
        { status: 400 }
      );
    }

    // Tạo Supabase client với token của user để RLS hoạt động đúng
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Lấy thông tin user hiện tại từ token
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Xác thực thất bại hoặc session đã hết hạn" },
        { status: 401 }
      );
    }

    // Insert dữ liệu vào bảng notebook_entries
    const { data, error: insertError } = await supabase
      .from("notebook_entries")
      .insert({
        user_id: user.id,
        title,
        answer,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Lỗi insert notebook:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Không thể lưu vào Sổ tay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("API /notebook lỗi:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const { data, error } = await supabase
      .from("notebook_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi lấy notebook:", error);
      return NextResponse.json(
        { error: error.message || "Không thể lấy dữ liệu Sổ tay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("API GET /notebook lỗi:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
