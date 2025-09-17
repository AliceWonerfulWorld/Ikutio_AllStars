"use client";

/// <reference types="google.maps" />

import { useRef, useEffect, useMemo } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { WeatherPost, weatherIcons, weatherLabels } from "../types";
import { escapeHtml, truncate } from "../utils/helpers";

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
          onMapClick({ lat, lng });
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
}