"use client";

import { useState } from "react";
import LoadingScreen from "./LoadingScreen";

interface LoadingScreenWrapperProps {
  children: React.ReactNode;
}

export default function LoadingScreenWrapper({ children }: LoadingScreenWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      {!isLoading && children}
    </>
  );
}
