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

  useEffect(() => {
    // ログインユーザーのUID取得
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
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
    if (!text.trim()) return;

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

    await supabase.from("todos").insert([newPost]);
    if (onPostAdded) onPostAdded();
    setText("");
    setTags([]);
    setImageFile(null);
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
