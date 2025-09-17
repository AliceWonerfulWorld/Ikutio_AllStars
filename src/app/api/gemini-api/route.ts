// app/api/gemini-api/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Body = {
  prompt_post?: string;
  user_id?: string; // フロントエンドから送信
};

export async function POST(req: Request) {
  try {
    const { prompt_post, user_id }: Body = (await req.json().catch(() => ({}))) ?? {};

    if (!prompt_post || typeof prompt_post !== "string") {
      return NextResponse.json(
        { error: "prompt_post (string) が必要です。" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が未設定です。" },
        { status: 500 }
      );
    }

    // Gemini APIの呼び出し
    const ai = new GoogleGenerativeAI(geminiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    // シンプルなプロンプト
    const prompt = `以下の質問に日本語で丁寧に答えてください：

${prompt_post}`;

    const resp = await model.generateContent(prompt);
    const responseText = resp.response.text();

    return NextResponse.json({
      response: responseText || "申し訳ありませんが、回答を生成できませんでした。",
      user_id: user_id, // デバッグ用
    });
  } catch (e: any) {
    console.error('Gemini API Error:', e);
    return NextResponse.json(
      { error: e?.message ?? "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
