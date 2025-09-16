// app/api/gemini-api/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenAI } from "@google/genai";

type Body = {
  prompt_post?: string;
  limit?: number; // 取得件数（オプション）
};

export async function POST(req: Request) {
  try {
    const { prompt_post, limit }: Body =
      (await req.json().catch(() => ({}))) ?? {};

    if (!prompt_post || typeof prompt_post !== "string") {
      return NextResponse.json(
        { error: "prompt_post (string) が必要です。" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const geminiKey = process.env.GEMINI_API_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "SUPABASE_URL / SUPABASE_ANON_KEY が未設定です。" },
        { status: 500 }
      );
    }
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が未設定です。" },
        { status: 500 }
      );
    }

    // cookie からセッションを復元する Supabase サーバークライアント
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });

    // 認証ユーザーを取得（cookie の JWT を使用）
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "未ログインです。先にサインインしてください。" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 自分のメッセージを取得（RLS により自分の行だけ見える想定）
    const take = Math.max(1, Math.min(limit ?? 10, 50));
    const { data, error } = await supabase
      .from("messages")
      .select("title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(take);

    if (error) {
      return NextResponse.json(
        { error: `Supabase select error: ${error.message}` },
        { status: 500 }
      );
    }

    const titles = (data ?? []).map((r) => r.title).filter(Boolean) as string[];

    // Gemini に渡すプロンプトを組み立て
    const context =
      titles.length > 0
        ? `# User recent titles\n${titles.map((t) => `- ${t}`).join("\n")}`
        : `# User recent titles\n(該当なし)`;

    const prompt = [
      context,
      "",
      "# Instruction",
      "上のユーザー履歴を文脈として参考にしつつ、次の質問に日本語で丁寧に答えてください。",
      "",
      "# Question",
      prompt_post,
    ].join("\n");

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return NextResponse.json({
      response: resp.text ?? "",
      used_titles: titles,
      user_id: userId, // デバッグ用に返す
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error" },
      { status: e?.status ?? 500 }
    );
  }
}
