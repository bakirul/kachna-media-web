"use client";

import React from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useGlobalStore } from "@/store/useGlobalStore";
import LiveMicToggle from "@/components/dashboard/LiveMicToggle";

export default function LiveSessionToolbar() {
  const isLiveSessionActive = useGlobalStore((state) => state.isLiveSessionActive);
  const setIsLiveSessionActive = useGlobalStore(
    (state) => state.setIsLiveSessionActive,
  );
  const setIsLiveMinimized = useDashboardStore((state) => state.setIsLiveMinimized);

  const handleJoinLiveVideoCall = () => {
    setIsLiveSessionActive(true);
    setIsLiveMinimized(false);
  };

  return (
    <div className="flex items-center gap-2">
      <LiveMicToggle compact disabled={!isLiveSessionActive} />
      <button
        type="button"
        onClick={handleJoinLiveVideoCall}
        className={`text-[11px] uppercase tracking-widest px-4 py-2 font-bold border transition-all flex items-center gap-2 rounded-md shadow-md ${
          isLiveSessionActive
            ? "bg-green-500/15 border-green-500/40 text-green-300"
            : "bg-[#1c1c24] hover:bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isLiveSessionActive && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLiveSessionActive ? "bg-green-500" : "bg-[#d4af37]"
            }`}
          />
        </span>
        <span className="hidden md:inline">
          {isLiveSessionActive ? "Live Call Active" : "Join Live Video Call"}
        </span>
        <span className="md:hidden">{isLiveSessionActive ? "Live" : "Join Call"}</span>
      </button>
    </div>
  );
}
