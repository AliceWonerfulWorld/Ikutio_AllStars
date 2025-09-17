// app/components/WebcamToTable.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/utils/supabase/client";

// 画像URL型
type Stamp = { id: number; make_stanp_url: string; created_at: string };

// === X風パレット & 共通スタイル ==========================================
const colors = {
  pageBg: "#0a0f14", // ページの黒
  panel: "#0f1115", // カード背景
  inset: "#0d1117", // さらに暗い面
  border: "#1e293b", // 枠線（青み）
  text: "#e6edf3", // 文字
  dim: "rgba(230,237,243,.7)",
  accent: "#1d9bf0", // アクセント（Xの青）
};

const borderBase: CSSProperties = { borderWidth: 1, borderStyle: "solid" };

const card: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderColor: colors.border,
  borderRadius: 16,
  padding: 12,
};

const pillBase: CSSProperties = {
  padding: 12,
  borderRadius: 999,
  border: `1px solid ${colors.border}`,
  borderColor: colors.border,
  background: "transparent",
  color: colors.text,
  transition:
    "background 120ms ease, border-color 120ms ease, transform 80ms ease",
};

const pillPrimary: CSSProperties = {
  ...pillBase,
  background: colors.accent,
  borderColor: colors.accent,
  color: colors.pageBg,
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
    for (let i = 0; i < len; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
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
      console.log("R2 upload result", result); // ← 追加
      if (!res.ok) throw new Error(result.error || "R2アップロード失敗");
      const imageUrl = result.url;
      // SupabaseにURL保存
      const { error, data } = await supabase.from("make_stamp").insert({
        make_stanp_url: imageUrl,
      });
      console.log("Supabase insert", { error, data, imageUrl }); // ← 追加
      if (error) throw error;
      setMsg("保存しました");
      await fetchRecent();
    } catch (e: any) {
      setMsg(`保存に失敗: ${e?.message ?? e}`);
      console.error("保存エラー", e); // ← 追加
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === UI ====================================================================
  return (
    <>
      {/* ページ全体を黒に（layout/globalsは触らない） */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: colors.pageBg,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: colors.text,
          maxWidth: 520,
          margin: "24px auto",
          display: "grid",
          gap: 12,
          fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", "Helvetica Neue", Arial`,
        }}
      >
        {/* タイトル行（X風ヘッダ） */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            background: "rgba(10,15,20,0.65)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "10px 12px",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          REALction
        </div>

        {/* カメラ/操作パネル */}
        <div style={card}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: 12,
              background: colors.inset,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: colors.border,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {!streaming ? (
              <button onClick={startCamera} style={{ ...pillPrimary, flex: 1 }}>
                🎥 REALctionを撮る
              </button>
            ) : (
              <>
                <button onClick={capture} style={{ ...pillBase, flex: 1 }}>
                  📸 撮影
                </button>
                <button onClick={stopCamera} style={{ ...pillBase, flex: 1 }}>
                  ■ 停止
                </button>
              </>
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={250}
          height={250}
          style={{ display: "none" }}
        />

        {/* プレビュー & 保存 */}
        {previewUrl && (
          <div style={card}>
            <img
              src={previewUrl}
              alt="preview"
              width={250}
              height={250}
              style={{
                width: "100%",
                aspectRatio: "1/1",
                objectFit: "cover",
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.border,
                display: "block",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 10,
              }}
            >
              <button
                onClick={upload}
                disabled={uploading}
                style={{ ...(uploading ? pillBase : pillPrimary) }}
              >
                {uploading ? "保存中…" : "⬆︎ REALctionを保存"}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <p style={{ color: colors.accent, margin: "4px 2px" }}>{msg}</p>
        )}

        {/* 仕切り */}
        <div
          style={{
            height: 1,
            background: colors.border,
            opacity: 0.9,
            margin: "8px 0",
          }}
        />

        {/* 最近の一覧 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: "8px 0", fontSize: 16 }}>
            最近保存した REALction
          </h3>
          <button onClick={fetchRecent} style={pillBase}>
            更新
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 12,
          }}
        >
          {(recent as any[]).map((r) => {
            // make_stampテーブル用: URLで表示
            const url = r.make_stanp_url;
            return (
              <figure
                key={r.id}
                style={{
                  ...card,
                  padding: 8,
                  margin: 0,
                  background: colors.inset,
                  borderColor: colors.border,
                }}
              >
                <img
                  src={url}
                  alt={r.id}
                  width={120}
                  height={120}
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: colors.border,
                    display: "block",
                  }}
                />
                <figcaption
                  style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}
                >
                  {new Date(r.created_at).toLocaleString()}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </>
  );
}
