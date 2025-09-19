"use client";

/// <reference types="google.maps" />

import { useRef, useEffect, useMemo, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { WeatherPost, weatherIcons, weatherLabels } from "../types";
import { escapeHtml, truncate } from "../utils/helpers";
import { ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react";

interface MapViewProps {
  posts: WeatherPost[];
  onMapClick: (coords: { lat: number; lng: number }) => void;
}

export default function MapView({ posts, onMapClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const pulseCircleRef = useRef<google.maps.Circle | null>(null);
  
  // 現在地関連の状態
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // パネルの状態
  const [isMinimized, setIsMinimized] = useState(false);

  // コメント吹き出し用（OverlayView）
  type CommentOV = google.maps.OverlayView & { setVisible(v: boolean): void };
  const overlaysRef = useRef<CommentOV[]>([]);
  const overlayCtorRef = useRef<null | (new (pos: google.maps.LatLng, text: string) => CommentOV)>(null);
  const ZOOM_FOR_COMMENT = 14;

  // デフォルトの中心位置を計算
  const defaultCenter = useMemo(() => {
    // 現在地が取得できている場合は現在地を優先
    if (currentLocation) {
      return currentLocation;
    }
    
    // 投稿がある場合は投稿の平均位置
    if (posts.length > 0) {
      const vals = posts.filter((p) => p.lat && p.lng).map((p) => [p.lat!, p.lng!]);
      if (vals.length) {
        const lat = vals.reduce((a, v) => a + v[0], 0) / vals.length;
        const lng = vals.reduce((a, v) => a + v[1], 0) / vals.length;
        return { lat, lng };
      }
    }
    
    // デフォルトは東京
    const [lat, lng] = (process.env.NEXT_PUBLIC_DEFAULT_CENTER || "35.681236,139.767125")
      .split(",")
      .map(Number);
    return { lat, lng };
  }, [posts.length, currentLocation]);

  // 現在地を取得する関数
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("位置情報サービスが利用できません");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setCurrentLocation(newLocation);
        setIsGettingLocation(false);
        
        // 地図の中心を現在地に移動
        if (mapObj.current) {
          mapObj.current.setCenter(newLocation);
          mapObj.current.setZoom(15); // より詳細なズームレベル
        }
        
        // 現在地マーカーを追加
        addCurrentLocationMarker(newLocation);
      },
      (error) => {
        console.error("位置情報取得エラー:", error);
        let errorMessage = "位置情報を取得できませんでした";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の許可が必要です";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました";
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分間キャッシュ
      }
    );
  };

  // カスタム現在地マーカーのSVGアイコンを作成
  const createCurrentLocationIcon = () => {
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- 外側のパルス効果 -->
        <circle cx="16" cy="16" r="14" fill="#4285F4" opacity="0.3">
          <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- 中側のパルス効果 -->
        <circle cx="16" cy="16" r="10" fill="#4285F4" opacity="0.5">
          <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- メインのピン -->
        <circle cx="16" cy="16" r="8" fill="#4285F4" stroke="#FFFFFF" stroke-width="3"/>
        <!-- 中央のドット -->
        <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
      </svg>
    `;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    };
  };

  // 現在地マーカーを追加する関数
  const addCurrentLocationMarker = (location: { lat: number; lng: number }) => {
    if (!mapObj.current) return;

    // 既存の現在地マーカーを削除
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }
    if (pulseCircleRef.current) {
      pulseCircleRef.current.setMap(null);
    }

    // パルス効果の円を追加
    const pulseCircle = new google.maps.Circle({
      strokeColor: "#4285F4",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#4285F4",
      fillOpacity: 0.2,
      map: mapObj.current,
      center: location,
      radius: 100, // 100メートル
      clickable: false,
    });
    pulseCircleRef.current = pulseCircle;

    // 新しい現在地マーカーを作成
    const marker = new google.maps.Marker({
      position: location,
      map: mapObj.current,
      title: "現在地",
      icon: createCurrentLocationIcon(),
      zIndex: 1000,
      animation: google.maps.Animation.DROP, // ドロップアニメーション
    });

    currentLocationMarkerRef.current = marker;

    // 現在地の情報ウィンドウ
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="color: #111; padding: 12px; max-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 24px; height: 24px; background: #4285F4; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 12px;">📍</span>
            </div>
            <div style="font-weight: 600; font-size: 14px;">現在地</div>
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            緯度: ${location.lat.toFixed(6)}<br>
            経度: ${location.lng.toFixed(6)}
          </div>
          <div style="margin-top: 8px; padding: 6px; background: #f0f8ff; border-radius: 4px; font-size: 11px; color: #4285F4;">
            💡 この周辺で天気を投稿できます
          </div>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(mapObj.current, marker);
    });

    // マーカーがクリックされたかのような効果で情報ウィンドウを自動表示
    setTimeout(() => {
      infoWindow.open(mapObj.current, marker);
      setTimeout(() => {
        infoWindow.close();
      }, 3000); // 3秒後に自動で閉じる
    }, 500);
  };

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
          zoom: currentLocation ? 15 : 6, // 現在地がある場合はより詳細なズーム
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
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
          onMapClick({ lat, lng });
        });

        map.addListener("zoom_changed", () => toggleOverlayVisibility());

        renderMarkers();
        buildOverlays();
        
        // 現在地が既に取得済みの場合はマーカーを追加
        if (currentLocation) {
          addCurrentLocationMarker(currentLocation);
        }
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
        currentLocationMarkerRef.current?.setMap(null);
      } catch {}
      try {
        pulseCircleRef.current?.setMap(null);
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
            <div style="
              max-width: 320px; 
              color: #111; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <!-- ヘッダー部分 -->
              <div style="
                display: flex; 
                align-items: center; 
                gap: 12px; 
                margin-bottom: 12px; 
                padding-bottom: 12px; 
                border-bottom: 1px solid #e5e7eb;
              ">
                <div style="
                  width: 40px; 
                  height: 40px; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  border-radius: 50%; 
                  color: #fff; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  font-weight: 700; 
                  font-size: 16px;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                ">${escapeHtml(p.userAvatar)}</div>
                <div>
                  <div style="font-weight: 600; font-size: 16px; color: #111; margin-bottom: 2px;">${escapeHtml(p.username)}</div>
                  <div style="color: #6b7280; font-size: 12px;">天気投稿</div>
                </div>
              </div>

              <!-- 位置情報 -->
              <div style="
                color: #6b7280; 
                font-size: 13px; 
                margin-bottom: 12px; 
                padding: 8px 12px; 
                background: #f8fafc; 
                border-radius: 8px; 
                border-left: 3px solid #3b82f6;
              ">
                📍 ${escapeHtml(p.location)}
              </div>

              <!-- 天気情報 -->
              <div style="
                display: flex; 
                align-items: center; 
                gap: 12px; 
                margin-bottom: 12px; 
                padding: 12px; 
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                border-radius: 12px; 
                border: 1px solid #bae6fd;
              ">
                <div style="font-size: 24px;">${label}</div>
                <div>
                  <div style="font-weight: 600; font-size: 18px; color: #111; margin-bottom: 2px;">
                    ${p.temperature}°C
                  </div>
                  <div style="color: #0891b2; font-size: 13px; font-weight: 500;">
                    ${escapeHtml(weatherLabels[p.weather as keyof typeof weatherLabels])}
                  </div>
                </div>
                <div style="margin-left: auto; text-align: right;">
                  <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">湿度</div>
                  <div style="color: #111; font-weight: 600; font-size: 14px;">${p.humidity}%</div>
                </div>
              </div>

              <!-- コメント -->
              <div style="
                background: #f9fafb; 
                border-radius: 12px; 
                padding: 12px; 
                margin-bottom: 12px; 
                border: 1px solid #e5e7eb;
              ">
                <div style="
                  display: flex; 
                  align-items: center; 
                  gap: 8px; 
                  margin-bottom: 8px;
                ">
                  <div style="
                    width: 20px; 
                    height: 20px; 
                    background: #3b82f6; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                  ">
                    <span style="color: white; font-size: 10px;">📅</span>
                  </div>
                  <div style="color: #6b7280; font-size: 12px; font-weight: 500;">コメント</div>
                </div>
                <div style="
                  white-space: pre-wrap; 
                  line-height: 1.6; 
                  color: #111; 
                  font-size: 14px;
                ">${escapeHtml(p.comment)}</div>
              </div>

              <!-- 投稿日付のみ -->
              <div style="
                display: flex; 
                justify-content: center; 
                padding-top: 12px; 
                border-top: 1px solid #e5e7eb;
              ">
                <div style="
                  color: #9ca3af; 
                  font-size: 12px; 
                  background: #f3f4f6; 
                  padding: 6px 12px; 
                  border-radius: 8px;
                  font-weight: 500;
                ">
                  📅 ${new Date(p.createdAt).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
              </div>
              </div>
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
      
      {/* コンパクトな情報パネル */}
      <div className="absolute top-4 right-4 w-64">
        {isMinimized ? (
          /* 最小化された状態 */
          <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md rounded-xl p-3 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full p-1">
                  <span className="text-sm">🌤️</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{posts.length}</div>
                  <div className="text-xs text-gray-400">投稿</div>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* 通常の状態 */
          <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md rounded-xl p-4 border border-gray-700/50 shadow-2xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">天気マップ</h3>
                <p className="text-xs text-gray-400">リアルタイム情報</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full p-1.5">
                  <span className="text-sm">🌤️</span>
                </div>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 統計情報 */}
            <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-lg p-3 mb-3 border border-gray-600/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white">{posts.length}</div>
                  <div className="text-xs text-gray-400">投稿数</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-300">地図をクリック</div>
                  <div className="text-xs text-gray-500">座標セット</div>
                </div>
              </div>
            </div>
            
            {/* 現在地ボタン */}
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] disabled:transform-none disabled:shadow-none text-sm"
            >
              {isGettingLocation ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>取得中...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">📍</span>
                  <span>現在地を取得</span>
                </>
              )}
            </button>
            
            {/* エラーメッセージ */}
            {locationError && (
              <div className="mt-3 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/30 rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-xs">⚠️</span>
                  </div>
                  <div className="text-red-300 text-xs">{locationError}</div>
                </div>
              </div>
            )}
            
            {/* 現在地情報 */}
            {currentLocation && (
              <div className="mt-3 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-lg p-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-4 h-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <span className="text-emerald-400 text-xs">✓</span>
                  </div>
                  <div className="text-emerald-300 text-xs font-medium">現在地取得済み</div>
                </div>
                <div className="text-xs text-gray-400 font-mono bg-gray-800/50 rounded px-2 py-1">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}