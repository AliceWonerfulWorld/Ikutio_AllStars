"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Image, Smile, Calendar, MapPin, BarChart3 } from "lucide-react";

interface PostFormProps {
  onPostAdded?: () => void;
  r2PublicUrl?: string;
}

export default function PostForm({ onPostAdded, r2PublicUrl }: PostFormProps) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [canPost, setCanPost] = useState<boolean>(false);
  const [postError, setPostError] = useState<string>("");

  useEffect(() => {
    // ログインユーザーのUID取得
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      // uselsからhas_posted取得
      const { data: userRow } = await supabase
        .from("usels")
        .select("has_posted")
        .eq("user_id", uid)
        .single();
      if (!userRow || userRow.has_posted === false) {
        setCanPost(true); // 初回投稿OK
        setPostError("");
      } else {
        // 2回目以降は24時間ルール
        const { data: lastPost } = await supabase
          .from("todos")
          .select("created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          // 0件の場合に 406 (Not Acceptable) を出さないよう single -> maybeSingle
          .maybeSingle();
        if (!lastPost) {
          setCanPost(true);
          setPostError("");
          return;
        }
        const last = new Date(lastPost.created_at);
        const now = new Date();
        const diffH = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
        if (diffH <= 24) {
          setCanPost(true);
          setPostError("");
        } else {
          setCanPost(false);
          setPostError(
            "前回投稿から24時間以上経過したため、これ以上投稿できません。"
          );
        }
      }
    });
  }, []);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const uniqueFileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.jpg`;
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 400;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas
            .toDataURL("image/jpeg", 0.7)
            .split(",")[1];
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: compressedBase64,
              fileName: uniqueFileName,
            }),
          });
          resolve(r2PublicUrl + uniqueFileName);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !canPost) return;

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile);
    }

    // 必要な投稿データを作成
    const newPost = {
      title: text,
      tags: tags,
      created_at: new Date().toISOString(),
      image_url: imageUrl,
      user_id: userId, // ←ここでUIDをセット
    };

    // 投稿処理
    const { error } = await supabase.from("todos").insert([newPost]);
    if (!error) {
      // 初回投稿ならusels.has_postedをtrueに
      await supabase
        .from("usels")
        .update({ has_posted: true })
        .eq("user_id", userId);
      if (onPostAdded) onPostAdded();
      setText("");
      setTags([]);
      setImageFile(null);
      setCanPost(false); // 2回目以降は24hルール
      setPostError(
        "前回投稿から24時間以内に再投稿しないと投稿できなくなります。"
      );
    } else {
      setPostError("投稿に失敗しました: " + error.message);
    }
  };

  const extractTags = (text: string) => {
    const tagMatches = text.match(/#([^\s#]+)/g);
    return tagMatches ? tagMatches.map((tag) => tag.substring(1)) : [];
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setTags(extractTags(value));
  };

  return (
    <div className="border-b border-gray-800 p-4">
      {!canPost && postError && (
        <div className="text-red-400 mb-2 text-sm">{postError}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
            U
          </div>

          <div className="flex-1">
            <div className="relative w-full min-h-[120px]">
              <div
                className="pointer-events-none w-full text-xl min-h-[120px] absolute top-0 left-0 z-0 px-3 py-2"
                style={{ whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{
                  __html: text.replace(
                    /#([\wぁ-んァ-ン一-龠]+)/g,
                    '<span style="color:#3b82f6">#$1</span>'
                  ),
                }}
              />
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="今何してる？"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-xl min-h-[120px] relative z-10 px-3 py-2"
                rows={3}
                maxLength={280}
                style={{ background: "transparent" }}
              />
            </div>

            {/* タグプレビュー */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-blue-400">
                <button
                  type="button"
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="画像を追加"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  <Image size={20} />
                </button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImageFile(file);
                  }}
                />
                <button
                  type="button"
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="投票を追加"
                >
                  <BarChart3 size={20} />
                </button>
                <button
                  type="button"
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="絵文字を追加"
                >
                  <Smile size={20} />
                </button>
                <button
                  type="button"
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="スケジュールを追加"
                >
                  <Calendar size={20} />
                </button>
                <button
                  type="button"
                  className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                  aria-label="場所を追加"
                >
                  <MapPin size={20} />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">{text.length}/280</div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-semibold transition-colors"
                >
                  投稿
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
