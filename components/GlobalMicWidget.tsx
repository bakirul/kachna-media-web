"use client";
import React, { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useGlobalStore } from "@/store/useGlobalStore";

interface GlobalMicWidgetProps {
  socket: Socket;
  user: any;
}

const SUPPORTED_LANGUAGES = [
  { label: "Bengali", value: "bn", geminiName: "Bengali", ttsCode: "bn-BD" },
  { label: "English", value: "en", geminiName: "English", ttsCode: "en-US" },
  { label: "Hindi", value: "hi", geminiName: "Hindi", ttsCode: "hi-IN" },
  { label: "Spanish", value: "es", geminiName: "Spanish", ttsCode: "es-ES" },
  { label: "Arabic", value: "ar", geminiName: "Arabic", ttsCode: "ar-SA" }
];

export default function GlobalMicWidget({ socket, user }: GlobalMicWidgetProps) {
  const { isMicActive, setIsMicActive, selectedLanguage } = useGlobalStore();
  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage) || SUPPORTED_LANGUAGES[1]; // default 'en'
  const recognitionRef = useRef<any>(null);

  const isEditor = user?.app_metadata?.role === "admin" || user?.app_metadata?.role === "editor";

  useEffect(() => {
    if (isEditor || typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = selectedLangObj.ttsCode;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript && socket) {
        socket.emit('translate-speech', { text: transcript, targetLang: selectedLangObj.geminiName });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [socket, isEditor, selectedLangObj]);

  useEffect(() => {
    if (isEditor) return;
    if (isMicActive && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (!isMicActive && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, [isMicActive, isEditor]);

  if (isEditor) return null;

  return (
    <div className="mt-3 ml-2 z-[60] pointer-events-auto flex items-center gap-2 font-sans">
      <button 
        onClick={() => setIsMicActive(!isMicActive)}
        className={`px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 backdrop-blur-md border shadow-2xl flex items-center gap-3 ${
          isMicActive 
            ? 'bg-black/80 text-white border-white/20 hover:bg-black' 
            : 'bg-black/60 text-white/70 border-white/10 hover:bg-black/80 hover:text-white hover:border-white/20'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isMicActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isMicActive ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-white/30'}`}></span>
        </span>
        {isMicActive ? "Live Translation Active" : "Enable Live Mic"}
      </button>
    </div>
  );
}
