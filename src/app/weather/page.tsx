"use client";

/// <reference types="google.maps" />

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { createClient } from "@supabase/supabase-js";
import {
  CloudSun,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Send,
  Plus,
  X,
  Heart,
  Map,
  List,
  Home,
} from "lucide-react";

/** ---- Supabase client ---- */
const supabase =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

interface WeatherPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  comment: string;
  imageUrl?: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  lat?: number;
  lng?: number;
}

export default function WeatherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<WeatherPost[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [newPost, setNewPost] = useState({
    location: "",
    weather: "sunny",
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    visibility: 10,
    comment: "",
  });
  const [postCoords, setPostCoords] = useState<{ lat: number; lng: number } | null>(null);

  /** ---- 初期ロード：Supabase から取得。失敗/未設定ならモックを表示 ---- */
  useEffect(() => {
    const mock: WeatherPost[] = [
      {
        id: "mock-1",
        userId: "user1",
        username: "アリス",
        userAvatar: "ア",
        location: "東京都渋谷区",
        weather: "sunny",
        temperature: 25,
        humidity: 45,
        windSpeed: 3,
        visibility: 15,
        comment: "今日は絶好の散歩日和！桜が満開でとても綺麗です",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 12,
        isLiked: false,
        lat: 35.6581,
        lng: 139.7016,
      },
      {
        id: "mock-2",
        userId: "user2",
        username: "ボブ",
        userAvatar: "ボ",
        location: "大阪府大阪市",
        weather: "cloudy",
        temperature: 22,
        humidity: 70,
        windSpeed: 8,
        visibility: 8,
        comment: "曇り空だけど、風が気持ちいい！ジョギングに最適な天気です‍♂️",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 8,
        isLiked: true,
        lat: 34.6937,
        lng: 135.5023,
      },
      {
        id: "mock-3",
        userId: "user3",
        username: "チャーリー",
        userAvatar: "チ",
        location: "福岡県福岡市",
        weather: "rainy",
        temperature: 18,
        humidity: 85,
        windSpeed: 12,
        visibility: 5,
        comment: "雨が降ってきました。傘を忘れずに！☔",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        likes: 15,
        isLiked: false,
        lat: 33.5904,
        lng: 130.4017,
      },
      {
        id: "mock-4",
        userId: "user4",
        username: "ダイアナ",
        userAvatar: "ダ",
        location: "北海道札幌市",
        weather: "snowy",
        temperature: -2,
        humidity: 90,
        windSpeed: 15,
        visibility: 3,
        comment: "雪が降っています。路面が滑りやすいので注意してください！❄️",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        likes: 22,
        isLiked: false,
        lat: 43.0642,
        lng: 141.3469,
      },
    ];

    const load = async () => {
      if (!supabase) {
        setPosts(mock);
        return;
      }
      const { data, error } = await supabase
        .from("weather")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error || !data) {
        console.warn("supabase load error:", error);
        setPosts(mock);
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
      setPosts(mapped.length ? mapped : mock);
    };
    load();
  }, []);

  const weatherIcons = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    snowy: "❄️",
    stormy: "⛈️",
  } as const;

  const weatherLabels = {
    sunny: "晴れ",
    cloudy: "曇り",
    rainy: "雨",
    snowy: "雪",
    stormy: "嵐",
  } as const;

  /** ---- 投稿：Supabase に insert 後、UI に反映 ---- */
  const handleSubmitPost = async () => {
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
            // likes はテーブル側 default 0 を推奨
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
      return;
    }

    setNewPost({
      location: "",
      weather: "sunny",
      temperature: 20,
      humidity: 60,
      windSpeed: 5,
      visibility: 10,
      comment: "",
    });
    setPostCoords(null);
    setShowPostForm(false);
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return "たった今";
  };

  /** ========================
   * MapView (Google Maps 実装)
   * ====================== */
  const MapView = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObj = useRef<google.maps.Map | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const infoRef = useRef<google.maps.InfoWindow | null>(null);

    // コメント吹き出し用（OverlayView）
    type CommentOV = google.maps.OverlayView & { setVisible(v: boolean): void };
    const overlaysRef = useRef<CommentOV[]>([]);
    const overlayCtorRef = useRef<null | (new (pos: google.maps.LatLng, text: string) => CommentOV)>(null);
    const ZOOM_FOR_COMMENT = 14;

    const defaultCenter = useMemo(() => {
      if (posts.length > 0) {
        const vals = posts.filter((p) => p.lat && p.lng).map((p) => [p.lat!, p.lng!]);
        if (vals.length) {
          const lat = vals.reduce((a, v) => a + v[0], 0) / vals.length;
          const lng = vals.reduce((a, v) => a + v[1], 0) / vals.length;
          return { lat, lng };
        }
      }
      const [lat, lng] = (process.env.NEXT_PUBLIC_DEFAULT_CENTER || "35.681236,139.767125")
        .split(",")
        .map(Number);
      return { lat, lng };
    }, [posts.length]);

    useEffect(() => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) {
        console.error("Google Maps: API key missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)");
        return;
      }
      const loader = new Loader({
        apiKey: key,
        version: "weekly",
        language: process.env.NEXT_PUBLIC_MAPS_LANG || "ja",
        region: process.env.NEXT_PUBLIC_MAPS_REGION || "JP",
      });

      let cancelled = false;

      loader
        .load()
        .then(() => {
          if (cancelled) return;
          const el = mapRef.current;
          if (!el) return;
          const map = new google.maps.Map(el, {
            center: defaultCenter,
            zoom: 6,
            clickableIcons: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
          });
          mapObj.current = map;
          clustererRef.current = new MarkerClusterer({ map, markers: [] });
          infoRef.current = new google.maps.InfoWindow();

          // コメントオーバーレイ
          class CommentOverlay extends google.maps.OverlayView {
            position: google.maps.LatLng;
            div?: HTMLDivElement;
            text: string;
            constructor(position: google.maps.LatLng, text: string) {
              super();
              this.position = position;
              this.text = text;
            }
            onAdd() {
              this.div = document.createElement("div");
              this.div.style.cssText = [
                "position:absolute",
                "transform:translate(-50%,-100%)",
                "background:rgba(0,0,0,0.75)",
                "color:#fff",
                "padding:6px 8px",
                "border-radius:8px",
                "font-size:12px",
                "line-height:1.4",
                "box-shadow:0 2px 6px rgba(0,0,0,0.3)",
                "white-space:nowrap",
                "max-width:240px",
                "pointer-events:none",
              ].join(";");
              this.div.textContent = this.text;
              this.getPanes()?.overlayMouseTarget.appendChild(this.div);
            }
            draw() {
              const proj = this.getProjection();
              if (!proj || !this.div) return;
              const pt = proj.fromLatLngToDivPixel(this.position);
              if (!pt) return;
              this.div.style.left = `${pt.x}px`;
              this.div.style.top = `${pt.y - 36}px`;
            }
            onRemove() {
              this.div?.remove();
              this.div = undefined;
            }
            setVisible(v: boolean) {
              if (this.div) this.div.style.display = v ? "block" : "none";
            }
          }
          overlayCtorRef.current = CommentOverlay;

          // 地図クリックで投稿フォーム
          map.addListener("click", (ev: google.maps.MapMouseEvent) => {
            const lat = ev.latLng?.lat();
            const lng = ev.latLng?.lng();
            if (lat == null || lng == null) return;
            setPostCoords({ lat, lng });
            setShowPostForm(true);
          });

          map.addListener("zoom_changed", () => toggleOverlayVisibility());

          renderMarkers();
          buildOverlays();
        })
        .catch((err) => {
          console.error("Google Maps loader error:", err);
        });

      return () => {
        cancelled = true;
        try {
          markersRef.current.forEach((m) => m.setMap(null));
        } catch {}
        try {
          clustererRef.current?.clearMarkers();
        } catch {}
        try {
          infoRef.current?.close();
        } catch {}
        try {
          overlaysRef.current.forEach((o) => o.setMap(null));
        } catch {}
        overlaysRef.current = [];
        clustererRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!mapObj.current) return;
      renderMarkers();
      buildOverlays();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts]);

    function truncate(s: string, n: number) {
      return s.length > n ? s.slice(0, n - 1) + "…" : s;
    }

    function buildOverlays() {
      const map = mapObj.current;
      const Ctor = overlayCtorRef.current;
      if (!map || !Ctor) return;

      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];

      const show = (map.getZoom() ?? 0) >= ZOOM_FOR_COMMENT;

      posts
        .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
        .forEach((p) => {
          const text = truncate(p.comment, 24);
          const ov = new Ctor(new google.maps.LatLng(p.lat!, p.lng!), text);
          ov.setMap(map);
          ov.setVisible(show);
          overlaysRef.current.push(ov);
        });
    }

    function toggleOverlayVisibility() {
      const zoom = mapObj.current?.getZoom();
      if (zoom == null) return;
      const show = zoom >= ZOOM_FOR_COMMENT;
      overlaysRef.current.forEach((o) => o.setVisible(show));
    }

    function renderMarkers() {
      if (!mapObj.current || !clustererRef.current) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      try {
        clustererRef.current.clearMarkers();
      } catch {}

      const mks: google.maps.Marker[] = posts
        .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
        .map((p) => {
          const label = (weatherIcons as any)[p.weather] || "";
          const marker = new google.maps.Marker({
            position: { lat: p.lat as number, lng: p.lng as number },
            label: { text: label, fontSize: "16px" },
          });

          marker.addListener("click", () => {
            const html = `
              <div style="max-width:240px;color:#111">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <div style="width:24px;height:24px;background:linear-gradient(90deg,#60a5fa,#a78bfa);border-radius:9999px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">${escapeHtml(
                    p.userAvatar
                  )}</div>
                  <div style="font-weight:600">${escapeHtml(p.username)}</div>
                </div>
                <div style="color:#666;font-size:12px;margin-bottom:6px">${escapeHtml(p.location)}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <div style="font-size:18px">${label}</div>
                  <div style="font-weight:600">${p.temperature}°C</div>
                  <div style="color:#888;font-size:12px">${escapeHtml(
                    weatherLabels[p.weather as keyof typeof weatherLabels]
                  )}</div>
                </div>
                <div style="white-space:pre-wrap;line-height:1.5;color:#111">${escapeHtml(p.comment)}</div>
                <div style="margin-top:8px;color:#777;font-size:12px">いいね ${p.likes} ・ ${new Date(
                  p.createdAt
                ).toLocaleString()}</div>
              </div>`;
            infoRef.current?.setContent(html);
            infoRef.current?.open({ map: mapObj.current!, anchor: marker });
          });

          return marker;
        });

      markersRef.current = mks;
      clustererRef.current.addMarkers(mks);
    }

    return (
      <div className="relative w-full h-[600px] bg-gray-800 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="absolute inset-0" />
        <div className="absolute top-4 right-4 bg-gray-900/80 rounded-lg p-2 border border-gray-800">
          <div className="text-xs text-gray-300 mb-1">投稿数: {posts.length}</div>
          <div className="text-xs text-gray-400">地図をクリックで投稿座標をセット</div>
        </div>
      </div>
    );
  };

  // リストビュー
  const ListView = () => (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={`${post.id}-${post.createdAt?.valueOf?.() ?? ""}`} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.userAvatar}
            </div>
            <div>
              <div className="font-semibold">{post.username}</div>
              <div className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{post.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weatherIcons[post.weather as keyof typeof weatherIcons]}</span>
                <span className="font-semibold">{weatherLabels[post.weather as keyof typeof weatherLabels]}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span>{post.temperature}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>{post.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-green-400" />
                <span>{post.windSpeed}m/s</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-400" />
                <span>{post.visibility}km</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-100 leading-relaxed">{post.comment}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                post.isLiked ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span>{post.likes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">ホーム</span>
            </button>

            <div className="flex items-center gap-3">
              <CloudSun className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">天気Yohoo!投稿</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === "map" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Map className="w-4 h-4" />
                マップ
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
                一覧
              </button>
            </div>

            <button
              onClick={() => setShowPostForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              投稿する
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {showPostForm && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">天気を投稿</h2>
              <button
                onClick={() => {
                  setShowPostForm(false);
                  setPostCoords(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postCoords && (
              <div className="text-xs text-gray-400 mb-3">
                位置: {postCoords.lat.toFixed(5)}, {postCoords.lng.toFixed(5)}（地図クリックで取得）
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">場所</label>
                <input
                  type="text"
                  value={newPost.location}
                  onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                  placeholder="例: 東京都渋谷区"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">天気</label>
                <select
                  value={newPost.weather}
                  onChange={(e) => setNewPost({ ...newPost, weather: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="sunny">☀️ 晴れ</option>
                  <option value="cloudy">☁️ 曇り</option>
                  <option value="rainy">🌧️ 雨</option>
                  <option value="snowy">❄️ 雪</option>
                  <option value="stormy">⛈️ 嵐</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">気温 (°C)</label>
                <input
                  type="number"
                  value={newPost.temperature}
                  onChange={(e) => setNewPost({ ...newPost, temperature: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text白"
                />
              </div>

              <div>
                <label className="block text_sm font-medium mb-2">湿度 (%)</label>
                <input
                  type="number"
                  value={newPost.humidity}
                  onChange={(e) => setNewPost({ ...newPost, humidity: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">風速 (m/s)</label>
                <input
                  type="number"
                  value={newPost.windSpeed}
                  onChange={(e) => setNewPost({ ...newPost, windSpeed: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">視程 (km)</label>
                <input
                  type="number"
                  value={newPost.visibility}
                  onChange={(e) => setNewPost({ ...newPost, visibility: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">コメント</label>
              <textarea
                value={newPost.comment}
                onChange={(e) => setNewPost({ ...newPost, comment: e.target.value })}
                placeholder="今日の天気についてコメントを書いてください..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
              />
            </div>

            <button
              onClick={handleSubmitPost}
              disabled={!newPost.location || !newPost.comment}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              投稿する
            </button>
          </div>
        )}

        {viewMode === "map" ? <MapView /> : <ListView />}
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      } as const
    )[c]!
  );
}
