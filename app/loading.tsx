"use client";

import { useEffect, useState } from "react";
import GearLogo from "@/components/GearLogo";

export default function Loading() {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if this is the first page load
    const hasSeenLoading = sessionStorage.getItem('hasSeenLoading');
    
    if (hasSeenLoading) {
      // Already shown loading, don't show again
      return;
    }

    // Mark that we've seen the loading screen
    sessionStorage.setItem('hasSeenLoading', 'true');
    
    setIsVisible(true);
    
    // Animate progress bar over 5 seconds
    const duration = 5000;
    const interval = 16; // ~60fps
    const increment = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    // Fade out after exactly 5 seconds
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setIsVisible(false), 500);
    }, 5000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeOutTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0c] flex items-center justify-center transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md px-8">
        {/* Gear Logo with animation */}
        <div className="animate-pulse">
          <GearLogo size={200} />
        </div>
        
        {/* Horizontal Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Loading</span>
            <span className="text-xs text-blue-400 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
