"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ViewMode, NewPostData } from "./types";
import { useWeatherPosts } from "./hooks/useWeatherPosts";
import WeatherHeader from "./components/WeatherHeader";
import WeatherPostForm from "./components/WeatherPostForm";
import MapView from "./components/MapView";
import ListView from "./components/ListView";

export default function WeatherPage() {
  const { user } = useAuth();
  const { posts, submitPost, handleLike } = useWeatherPosts();
  
  const [showPostForm, setShowPostForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [postCoords, setPostCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newPost, setNewPost] = useState<NewPostData>({
    location: "",
    weather: "sunny",
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    visibility: 10,
    comment: "",
  });

  const handleSubmitPost = async () => {
    try {
      await submitPost(newPost, postCoords, user);
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
    } catch (error) {
      // エラーは useWeatherPosts 内で処理済み
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setPostCoords(coords);
    setShowPostForm(true);
  };

  const handleCloseForm = () => {
    setShowPostForm(false);
    setPostCoords(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <WeatherHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCreatePost={() => setShowPostForm(true)}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {showPostForm && (
          <WeatherPostForm
            newPost={newPost}
            setNewPost={setNewPost}
            postCoords={postCoords}
            onSubmit={handleSubmitPost}
            onClose={handleCloseForm}
          />
        )}

        {viewMode === "map" ? (
          <MapView posts={posts} onMapClick={handleMapClick} />
        ) : (
          <ListView posts={posts} onLike={handleLike} />
        )}
      </div>
    </div>
  );
}
