"use client";

import { useState, useEffect } from "react";
import { WeatherPost, NewPostData } from "../types";
import { supabase } from "../utils/supabase";
import { mockWeatherPosts } from "../data/mockData";

export function useWeatherPosts() {
  const [posts, setPosts] = useState<WeatherPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!supabase) {
        setPosts(mockWeatherPosts);
        return;
      }
      
      const { data, error } = await supabase
        .from("weather")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
        
      if (error || !data) {
        console.warn("supabase load error:", error);
        setPosts(mockWeatherPosts);
        return;
      }
      
      const mapped: WeatherPost[] = data.map((r: any) => ({
        id: String(r.id ?? crypto.randomUUID()),
        userId: r.user_id ?? "",
        username: r.username ?? "ユーザー",
        userAvatar: r.user_avatar ?? (r.username?.[0] ?? "ユ"),
        location: r.location ?? "",
        weather: r.weather ?? "sunny",
        temperature: Number(r.temperature ?? 0),
        humidity: Number(r.humidity ?? 0),
        windSpeed: Number(r.wind_speed ?? 0),
        visibility: Number(r.visibility ?? 0),
        comment: r.comment ?? "",
        imageUrl: r.image_url ?? undefined,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        likes: Number(r.likes ?? 0),
        isLiked: false,
        lat: typeof r.lat === "number" ? r.lat : undefined,
        lng: typeof r.lng === "number" ? r.lng : undefined,
      }));
      
      setPosts(mapped.length ? mapped : mockWeatherPosts);
    };
    
    loadPosts();
  }, []);

  const submitPost = async (
    newPost: NewPostData,
    postCoords: { lat: number; lng: number } | null,
    user: any
  ) => {
    if (!user || !newPost.location || !newPost.comment) return;

    const fallback = {
      lat: 35.6762 + (Math.random() - 0.5) * 0.1,
      lng: 139.6503 + (Math.random() - 0.5) * 0.1,
    };
    const coords = postCoords ?? fallback;

    const username =
      (user as any).user_metadata?.displayName ||
      (user as any).user_metadata?.username ||
      "ユーザー";
    const userAvatar =
      (user as any).user_metadata?.displayName?.[0] ||
      (user as any).user_metadata?.username?.[0] ||
      "ユ";

    // まずはローカルに先行反映（楽観的UI）
    const optimistic: WeatherPost = {
      id: `tmp-${Date.now()}`,
      userId: (user as any).id,
      username,
      userAvatar,
      location: newPost.location,
      weather: newPost.weather,
      temperature: newPost.temperature,
      humidity: newPost.humidity,
      windSpeed: newPost.windSpeed,
      visibility: newPost.visibility,
      comment: newPost.comment,
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      lat: coords.lat,
      lng: coords.lng,
    };
    setPosts((p) => [optimistic, ...p]);

    try {
      if (!supabase) throw new Error("Supabase client not configured.");
      const { data, error } = await supabase
        .from("weather")
        .insert([
          {
            user_id: (user as any).id,
            username,
            user_avatar: userAvatar,
            location: newPost.location,
            weather: newPost.weather,
            temperature: newPost.temperature,
            humidity: newPost.humidity,
            wind_speed: newPost.windSpeed,
            visibility: newPost.visibility,
            comment: newPost.comment,
            image_url: null,
            lat: coords.lat,
            lng: coords.lng,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;

      // 返ってきた行で optimistic を置き換え
      const saved: WeatherPost = {
        id: String(data.id ?? crypto.randomUUID()),
        userId: data.user_id ?? (user as any).id,
        username: data.username ?? username,
        userAvatar: data.user_avatar ?? userAvatar,
        location: data.location ?? newPost.location,
        weather: data.weather ?? newPost.weather,
        temperature: Number(data.temperature ?? newPost.temperature),
        humidity: Number(data.humidity ?? newPost.humidity),
        windSpeed: Number(data.wind_speed ?? newPost.windSpeed),
        visibility: Number(data.visibility ?? newPost.visibility),
        comment: data.comment ?? newPost.comment,
        imageUrl: data.image_url ?? undefined,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        likes: Number(data.likes ?? 0),
        isLiked: false,
        lat: typeof data.lat === "number" ? data.lat : coords.lat,
        lng: typeof data.lng === "number" ? data.lng : coords.lng,
      };

      setPosts((prev) => {
        const withoutTmp = prev.filter((x) => x.id !== optimistic.id);
        return [saved, ...withoutTmp];
      });
    } catch (e) {
      console.error("insert failed:", e);
      // 失敗したら楽観反映を戻す
      setPosts((prev) => prev.filter((x) => x.id !== optimistic.id));
      alert("投稿に失敗しました。設定（URL/AnonKey/RLS）をご確認ください。");
      throw e;
    }
  };

  const handleLike = (postId: string) => {
    setPosts((posts) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  return {
    posts,
    submitPost,
    handleLike,
  };
}