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
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    setCameraError(null);
    
    try {
      // モバイル対応のカメラ設定
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: "user" },
          // モバイルでの安定性向上のため追加制約
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false,
      };

      // まず理想的な設定で試行
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // フォールバック: より緩い制約で再試行
        console.warn("理想的なカメラ設定で失敗、フォールバック設定を試行:", error);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      const v = videoRef.current!;
      v.srcObject = stream;
      
      // モバイルでの再生問題を回避
      v.playsInline = true;
      v.muted = true;
      
      try {
        await v.play();
        setStreaming(true);
        setMsg("カメラが正常に起動しました");
      } catch (playError) {
        console.error("動画再生エラー:", playError);
        setCameraError("カメラの再生に失敗しました。ページを再読み込みしてください。");
        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop());
      }
      
    } catch (e: any) {
      console.error("カメラ起動エラー:", e);
      
      let errorMessage = "カメラ起動に失敗しました";
      
      if (e.name === "NotAllowedError") {
        errorMessage = "カメラへのアクセスが拒否されました。ブラウザの設定でカメラの許可を確認してください。";
      } else if (e.name === "NotFoundError") {
        errorMessage = "カメラが見つかりません。デバイスにカメラが接続されているか確認してください。";
      } else if (e.name === "NotSupportedError") {
        errorMessage = "このブラウザはカメラをサポートしていません。HTTPS接続が必要な場合があります。";
      } else if (e.name === "NotReadableError") {
        errorMessage = "カメラが他のアプリケーションで使用されています。他のアプリを閉じてから再試行してください。";
      } else if (e.message) {
        errorMessage = `カメラエラー: ${e.message}`;
      }
      
      setCameraError(errorMessage);
      setMsg(errorMessage);
    }
  };

  const stopCamera = () => {
    setStreaming(false);
    setCameraError(null);
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (v) {
      v.srcObject = null;
    }
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
        <div className="relative bg-black" style={{ height: '400px' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* カメラオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* カメラエラー表示 */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="text-center p-6 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">カメラエラー</h3>
                <p className="text-gray-300 text-sm mb-4">{cameraError}</p>
                <div className="space-y-2">
                  <button
                    onClick={startCamera}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    再試行
                  </button>
                  <button
                    onClick={() => setCameraError(null)}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* コントロールパネル */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            {!streaming ? (
              <button
                onClick={startCamera}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-400 hover:via-pink-400 hover:to-red-400 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-500/30 transform hover:scale-105"
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
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm hover:from-white/30 hover:to-white/20 text-white rounded-full transition-all duration-200 border border-white/20 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>撮影</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-400/80 hover:to-red-500/80 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-500/30"
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
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* プレビュー画像 */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="w-32 h-32 object-cover rounded-xl border border-gray-700"
                />
              </div>
              
              {/* アクションボタン */}
              <div className="flex-1 w-full sm:w-auto">
                <h3 className="text-lg font-semibold text-white mb-2 text-center sm:text-left">撮影完了</h3>
                <p className="text-gray-400 mb-4 text-center sm:text-left">この画像でREALctionを作成しますか？</p>
                
                {/* ボタン群 */}
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={upload}
                    disabled={uploading}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>REALctionを保存</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setPreviewUrl(null)}
                    disabled={uploading}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 disabled:from-gray-800 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>保存しない</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ステータスメッセージ */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl border ${
          msg.includes('失敗') || msg.includes('エラー') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {msg}
        </div>
      )}

      {/* 最近のREALction */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
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
