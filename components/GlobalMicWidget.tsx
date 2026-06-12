"use client";
import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

interface GlobalMicWidgetProps {
  socket: Socket;
  user: any;
}

const SUPPORTED_LANGUAGES = [
  { label: "Bengali", geminiName: "Bengali", ttsCode: "bn-BD" },
  { label: "English", geminiName: "English", ttsCode: "en-US" },
  { label: "Hindi", geminiName: "Hindi", ttsCode: "hi-IN" },
  { label: "Spanish", geminiName: "Spanish", ttsCode: "es-ES" },
  { label: "Arabic", geminiName: "Arabic", ttsCode: "ar-SA" }
];

export default function GlobalMicWidget({ socket, user }: GlobalMicWidgetProps) {
  const [isMicActive, setIsMicActive] = useState(false);
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const recognitionRef = useRef<any>(null);

  // If the user is an admin/editor, they only receive TTS, so they don't need the mic widget
  const isEditor = user?.app_metadata?.role === "admin" || user?.app_metadata?.role === "editor";

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
        socket.emit('translate-speech', { text: transcript, targetLang: selectedLang.geminiName });
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
  }, [socket, isEditor, selectedLang]);

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

  if (isEditor) return null;

  return (
    <div className="mt-3 ml-2 z-[60] pointer-events-auto flex items-center gap-2">
      <button 
        onClick={() => setIsMicActive(!isMicActive)}
        className={`px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shadow-2xl flex items-center gap-2.5 ${
          isMicActive 
            ? 'bg-[#1c1c24] text-green-400 border-green-500/50 hover:bg-[#1c1c24]' 
            : 'bg-[#121217] text-[#d4af37] border-[#d4af37]/40 hover:bg-[#1c1c24] hover:scale-105'
        }`}
        title="Speak to send translated text"
      >
        <span className="relative flex h-2.5 w-2.5">
          {isMicActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isMicActive ? 'bg-red-500' : 'bg-gray-500'}`}></span>
        </span>
        {isMicActive ? "Live Translation Mic ON" : "Enable Live Translation Mic"}
      </button>

      <select 
        value={selectedLang.geminiName}
        onChange={(e) => {
          const lang = SUPPORTED_LANGUAGES.find(l => l.geminiName === e.target.value);
          if (lang) setSelectedLang(lang);
        }}
        className="bg-[#121217] text-[#d4af37] text-[10px] border border-[#d4af37]/40 rounded-lg px-3 py-2.5 outline-none font-bold uppercase tracking-wider cursor-pointer shadow-2xl hover:bg-[#1c1c24] transition-colors"
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang.geminiName} value={lang.geminiName}>
            Translate to: {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
