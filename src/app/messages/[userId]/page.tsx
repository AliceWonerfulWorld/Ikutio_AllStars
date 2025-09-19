"use client";

import { useState, useEffect, useRef, use } from "react";
import { ArrowLeft, Send, MoreVertical, Hourglass } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";
import { supabase } from "@/utils/supabase/client";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  isOwn: boolean;
}

interface User {
  id: string;
  username: string;
  // 必要に応じて他のカラムも追加
}

// Message型をmessage型に統一
type message = {
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  id?: string;
  isOwn?: boolean;
};

// 24時間後までの残り時間を計算する関数
function getRemainingTime(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const expires = created + 24 * 60 * 60 * 1000;
  const now = Date.now();
  const diff = expires - now;
  if (diff <= 0) return "00:00:00";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Next.js 14以降では、paramsはPromiseで渡されるため、use(params)でアンラップするだけでOKです。
// 型もReact.Usable<{ userId: string }>で統一し、分岐やtypeofチェックは不要です。

export default function ChatPage({
  params,
}: {
  params: React.Usable<{ userId: string }>;
}) {
  const { userId } = use(params);

  const [messages, setMessages] = useState<message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ログインユーザー取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) return;
      // uselsテーブルからユーザー情報取得
      const { data: userData } = await supabase
        .from("usels")
        .select("user_id, username") // ← as句を外す
        .eq("user_id", uid)
        .single();
      if (userData) {
        setCurrentUser({
          id: userData.user_id,
          username: userData.username,
        });
      }
    };
    fetchCurrentUser();
  }, []);

  // 相手ユーザー情報取得
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!userId) return;
      const { data: userData } = await supabase
        .from("usels")
        .select("user_id, username") // ← as句を外す
        .eq("user_id", userId)
        .single();
      if (userData) {
        setOtherUser({
          id: userData.user_id,
          username: userData.username,
        });
      }
    };
    fetchOtherUser();
  }, [userId]);

  // メッセージ取得 & リアルタイム購読
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser || !otherUser) return;
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      if (!error && messagesData) {
        setMessages(
          messagesData.map((msg: any) => ({
            ...msg,
            isOwn: msg.sender_id === currentUser.id,
          }))
        );
      }
    };
    fetchMessages();

    // Supabaseリアルタイム購読
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, otherUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading || !currentUser || !otherUser) return;

    setIsLoading(true);

    // message型でinsert
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          text: newMessage,
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      alert("メッセージ送信エラー: " + error.message);
    }

    if (!error && data) {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          isOwn: true,
        },
      ]);
      setNewMessage("");
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return "U";
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* デスクトップ: 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800 flex flex-col h-screen">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/messages"
                  className="hover:bg-gray-800 p-2 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getAvatarLetter(otherUser?.username || "U")}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">
                      {otherUser?.username || "Unknown User"}
                    </h1>
                    <p className="text-sm text-gray-500">オンライン</p>
                  </div>
                </div>
              </div>
              <button className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex space-x-2 max-w-xs lg:max-w-md ${
                    message.isOwn ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {!message.isOwn && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getAvatarLetter(otherUser?.username || "")}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Hourglass size={14} className="text-yellow-400" />
                      <span
                        className={`text-xs ${
                          message.isOwn ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {getRemainingTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-gray-800 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力 */}
          <div className="sticky bottom-20 lg:bottom-0 bg-black/80 backdrop-blur-md border-t border-gray-800 p-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="メッセージを入力..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={1}
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* デスクトップ: 右サイドバー - 大きなデスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">メッセージについて</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                リアルタイムでメッセージのやり取りができます。Enterキーで送信、Shift+Enterで改行ができます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <MobileNavigation />
      <MobileExtendedNavigation />
    </div>
  );
}
