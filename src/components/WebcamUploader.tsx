// app/components/WebcamToTable.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/utils/supabase/client";

// 画像URL型
type Stamp = { id: number; make_stanp_url: string; created_at: string };

// === モダンなカラーパレット ==========================================
const colors = {
  background: "#000000",
  surface: "#111111",
  surfaceElevated: "#1a1a1a",
  border: "#333333",
  borderLight: "#444444",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  accent: "#8b5cf6", // Purple accent
  accentHover: "#7c3aed",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

export default function WebcamToTable() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recent, setRecent] = useState<Stamp[]>([]);

  // --- utils ---
  const drawCoverToCanvas = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    const size = 250;
    canvas.width = size;
    canvas.height = size;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const ctx = canvas.getContext("2d")!;
    const videoAspect = vw / vh;
    const canvasAspect = 1;

    let sx = 0,
      sy = 0,
      sw = vw,
      sh = vh;
    if (videoAspect > canvasAspect) {
      const newSw = vh * canvasAspect;
      sx = (vw - newSw) / 2;
      sw = newSw;
    } else {
      const newSh = vw / canvasAspect;
      sy = (vh - newSh) / 2;
      sh = newSh;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
  };

  const blobToByteaHex = async (blob: Blob) => {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return "\\x" + hex;
  };

  const byteaHexToBlob = (hex: string, mime = "image/jpeg") => {
    const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
    const len = clean.length / 2;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    return new Blob([out], { type: mime });
  };

  const startCamera = async () => {
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      setStreaming(true);
    } catch (e: any) {
      setMsg(`カメラ起動に失敗: ${e?.message ?? e}`);
    }
  };

  const stopCamera = () => {
    setStreaming(false);
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
  };

  const capture = () => {
    setMsg(null);
    const v = videoRef.current!;
    const c = canvasRef.current!;
    drawCoverToCanvas(v, c);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  };

  const upload = async () => {
    setMsg(null);
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId)
        throw new Error("ログインが必要です（authユーザーのみ保存可）");

      const c = canvasRef.current!;
      const blob: Blob = await new Promise((res, rej) =>
        c.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob失敗"))),
          "image/jpeg",
          0.92
        )
      );
      // R2へアップロード
      const formData = new FormData();
      formData.append("file", blob, "reaction.jpg");
      formData.append("userId", userId);
      const res = await fetch("/api/upload-reaction", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      console.log("R2 upload result", result);
      if (!res.ok) throw new Error(result.error || "R2アップロード失敗");
      const imageUrl = result.url;
      // SupabaseにURL保存
      const { error, data } = await supabase.from("make_stamp").insert({
        make_stanp_url: imageUrl,
      });
      console.log("Supabase insert", { error, data, imageUrl });
      if (error) throw error;
      setMsg("保存しました");
      await fetchRecent();
    } catch (e: any) {
      setMsg(`保存に失敗: ${e?.message ?? e}`);
      console.error("保存エラー", e);
    } finally {
      setUploading(false);
    }
  };

  const fetchRecent = async () => {
    const { data, error } = await supabase
      .from("make_stamp")
      .select("id,make_stanp_url,created_at")
      .order("created_at", { ascending: false })
      .limit(6);
    if (!error && data) setRecent(data as Stamp[]);
  };

  useEffect(() => {
    fetchRecent();
    return () => stopCamera();
  }, []);

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // 画像URLを生成
  const getImageUrl = (image_url?: string) => {
    if (!image_url) return "";
    if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
      return image_url;
    }
    const trimmed = image_url.trim();
    return `${R2_PUBLIC_URL}${trimmed}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* メインカメラセクション */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* カメラビュー */}
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* カメラオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* コントロールパネル */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            {!streaming ? (
              <button
                onClick={startCamera}
                className="flex items-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>カメラを起動</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={capture}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>撮影</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>停止</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* プレビュー & 保存セクション */}
        {previewUrl && (
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-start space-x-6">
              {/* プレビュー画像 */}
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="w-32 h-32 object-cover rounded-xl border border-gray-700"
                />
              </div>
              
              {/* アクションボタン */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">撮影完了</h3>
                <p className="text-gray-400 mb-4">この画像でREALctionを作成しますか？</p>
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>REALctionを保存</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ステータスメッセージ */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl border ${
          msg.includes('失敗') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {msg}
        </div>
      )}

      {/* 最近のREALction */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">最近のREALction</h2>
            <p className="text-gray-400 text-sm">過去に作成したリアクション</p>
          </div>
          <button
            onClick={fetchRecent}
            className="px-4 py-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200"
          >
            更新
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {recent.map((stamp) => (
            <div
              key={stamp.id}
              className="group relative aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200"
            >
              <img
                src={getImageUrl(stamp.make_stanp_url)}
                alt={`REALction ${stamp.id}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-white font-medium">
                  {new Date(stamp.created_at).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {/* 空のスロット */}
          {Array.from({ length: 6 - recent.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* 隠しキャンバス */}
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        style={{ display: "none" }}
      />
    </div>
  );
}
