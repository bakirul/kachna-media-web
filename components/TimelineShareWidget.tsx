"use client";
import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

interface TimelineShareWidgetProps {
  cinemaVideoRef: React.RefObject<HTMLVideoElement>;
  socket?: Socket | null;
  isEditor?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { label: "Bengali", geminiName: "Bengali", ttsCode: "bn-BD" },
  { label: "English", geminiName: "English", ttsCode: "en-US" },
  { label: "Hindi", geminiName: "Hindi", ttsCode: "hi-IN" },
  { label: "Spanish", geminiName: "Spanish", ttsCode: "es-ES" },
  { label: "Arabic", geminiName: "Arabic", ttsCode: "ar-SA" }
];

const TimelineShareWidget = React.memo(({ cinemaVideoRef, socket, isEditor }: TimelineShareWidgetProps) => {
  const [liveSubtitle, setLiveSubtitle] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[DEBUG: UI Mount] Timeline Widget Mounted");
  }, []);

  // Admin Side: Listen to translation and speak
  useEffect(() => {
    if (!socket || !isEditor) return;

    const handleTranslation = (data: { original: string; translated: string }) => {
      setLiveSubtitle(data.translated);

      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
      }
      subtitleTimeoutRef.current = setTimeout(() => {
        setLiveSubtitle(null);
      }, 5000);

      // Audio Playback (TTS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.translated);
        utterance.lang = selectedLang.ttsCode;
        window.speechSynthesis.speak(utterance);
      }
    };

    socket.on('receive-translated-speech', handleTranslation);

    return () => {
      socket.off('receive-translated-speech', handleTranslation);
      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
      }
    };
  }, [socket, isEditor, selectedLang]);

  return (
    <div className="flex-1 h-full w-full bg-black relative flex items-center justify-center animate-fade-in">
      <video
        ref={cinemaVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-black/85 text-[#d4af37] text-[10px] px-3.5 py-2 rounded-lg border border-[#d4af37]/45 backdrop-blur-md z-10 flex flex-col gap-2.5 font-bold tracking-widest uppercase shadow-2xl select-none">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>Cinema Mode: Live Editing Share</span>
        </div>
        {isEditor && (
          <select 
            value={selectedLang.ttsCode}
            onChange={(e) => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.ttsCode === e.target.value);
              if (lang) setSelectedLang(lang);
            }}
            className="bg-black/50 text-[#d4af37] text-[9px] border border-[#d4af37]/40 rounded px-2 py-1 outline-none font-bold uppercase mt-1 w-fit cursor-pointer hover:bg-white/10 transition-colors"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.ttsCode} value={lang.ttsCode} className="bg-black">
                Hear in: {lang.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {isEditor && liveSubtitle && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg text-white text-lg font-bold text-center z-50 whitespace-pre-wrap max-w-[80%] shadow-lg border border-white/10 backdrop-blur-sm">
          {liveSubtitle}
        </div>
      )}
    </div>
  );
});

TimelineShareWidget.displayName = "TimelineShareWidget";

export default TimelineShareWidget;
