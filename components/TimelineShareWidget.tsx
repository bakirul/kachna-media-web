"use client";
import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

interface TimelineShareWidgetProps {
  cinemaVideoRef: React.RefObject<HTMLVideoElement>;
  socket?: Socket | null;
  isEditor?: boolean;
}

const TimelineShareWidget = React.memo(({ cinemaVideoRef, socket, isEditor }: TimelineShareWidgetProps) => {
  const [liveSubtitle, setLiveSubtitle] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const recognitionRef = useRef<any>(null);
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
        utterance.lang = 'bn-BD';
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
  }, [socket, isEditor]);

  // Client Side: Speech Recognition
  useEffect(() => {
    if (isEditor || typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript && socket) {
        socket.emit('translate-speech', { text: transcript, targetLang: 'Bengali' });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [socket, isEditor]);

  useEffect(() => {
    if (isEditor) return;
    if (isMicActive && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else if (!isMicActive && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [isMicActive, isEditor]);

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
        {!isEditor && (
          <button 
            onClick={() => setIsMicActive(!isMicActive)}
            className={`px-3 py-1.5 rounded text-[9px] transition-colors border ${isMicActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
          >
            {isMicActive ? "🔴 Live Translation Mic ON" : "Enable Live Translation Mic"}
          </button>
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
