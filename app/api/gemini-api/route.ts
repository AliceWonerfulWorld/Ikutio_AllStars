// app/api/gemini-api/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

type Body = {
  prompt_post?: string;
  user_id?: string;
  limit?: number; // 省略可: 何件まで取るか（デフォルト10）
};

export async function POST(req: Request) {
  try {
    const { prompt_post, user_id, limit }: Body =
      (await req.json().catch(() => ({}))) ?? {};

    if (!prompt_post || typeof prompt_post !== "string") {
      return NextResponse.json(
        { error: "prompt_post (string) が必要です。" },
        { status: 400 }
      );
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "user_id (string) が必要です。" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // サーバー専用
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。" },
        { status: 500 }
      );
    }
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が未設定です。" },
        { status: 500 }
      );
    }

    // Supabase クライアント（サーバーのみ）
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 例: messages テーブルに (user_id, title, created_at) がある想定
    const take = Math.max(1, Math.min(limit ?? 10, 50));
    const { data, error } = await supabase
      .from("messages")
      .select("title")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(take);

    if (error) {
      return NextResponse.json(
        { error: `Supabase select error: ${error.message}` },
        { status: 500 }
      );
    }

    const titles = (data ?? []).map((r) => r.title).filter(Boolean) as string[];

    // Gemini へ渡すコンテキストを組み立て
    const context =
      titles.length > 0
        ? `# User recent titles\n` +
          titles.map((t) => `- ${t}`).join("\n")
        : `# User recent titles\n(該当なし)`;

    // ユーザーの質問と合わせて1メッセージにまとめる（簡単で確実）
    const composed = [
      `${context}`,
      ``,
      `# Instruction`,
      `上の「User recent titles」を、このユーザーの直近の発言背景として参考にしつつ、次の質問に日本語で丁寧に答えてください。`,
      ``,
      `# Question`,
      prompt_post,
    ].join("\n");

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [{ text: composed }],
        },
      ],
    });

    const text = resp.text ?? "";
    return NextResponse.json({ response: text, used_titles: titles });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error" },
      { status: e?.status ?? 500 }
    );
  }
}
