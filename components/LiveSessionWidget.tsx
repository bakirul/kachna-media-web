"use client";
import React, { useEffect, useState, useRef } from "react";
import Peer from "simple-peer";
import { Socket } from "socket.io-client";

interface LiveSessionProps {
  socket: Socket | null;
  roomId: string;
  user: any;
}

// 🚀 Helper Component for rendering Remote Video Streams
const VideoPeer = ({ peer }: { peer: Peer.Instance }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-10 h-10 object-cover rounded-full border border-[#d4af37] shadow-md bg-black shrink-0"
    />
  );
};

export default function LiveSessionWidget({
  socket,
  roomId,
  user,
}: LiveSessionProps) {
  // 🌟 দুই স্তরের স্টেট কন্ট্রোল
  const [hasJoined, setHasJoined] = useState(false); // লাইভে যুক্ত আছেন কি না
  const [isMinimized, setIsMinimized] = useState(false); // উইন্ডো মিনিমাইজড কি না

  const [peers, setPeers] = useState<{ peerID: string; peer: Peer.Instance }[]>(
    [],
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { senderName: string; text: string; timestamp: string }[]
  >([]);
  const [newMsg, setNewMsg] = useState("");

  const myVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [socketId: string]: Peer.Instance }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // অটো স্ক্রোল চ্যাট
  useEffect(() => {
    if (hasJoined && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isMinimized, hasJoined]);

  // WebRTC & Socket Initialization (শুধুমাত্র hasJoined ট্রু হলে রান হবে)
  useEffect(() => {
    if (!socket || !roomId || !hasJoined) return;

    let localStream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        localStream = mediaStream;
        setStream(mediaStream);
        if (myVideo.current) myVideo.current.srcObject = mediaStream;

        socket.emit("join-call", roomId, user?.email || "Team Member");

        socket.on("user-connected", (userId: string, socketId: string) => {
          const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: mediaStream,
          });

          peer.on("signal", (signal) => {
            socket.emit("webrtc-offer", {
              targetSocketId: socketId,
              callerId: user?.id,
              sdp: signal,
            });
          });

          peersRef.current[socketId] = peer;
          setPeers((prev) => [...prev, { peerID: socketId, peer }]);
        });

        socket.on("webrtc-offer", (data) => {
          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: mediaStream,
          });

          peer.on("signal", (signal) => {
            socket.emit("webrtc-answer", {
              targetSocketId: data.callerSocketId,
              sdp: signal,
            });
          });

          peer.signal(data.sdp);
          peersRef.current[data.callerSocketId] = peer;
          setPeers((prev) => [...prev, { peerID: data.callerSocketId, peer }]);
        });

        socket.on("webrtc-answer", (data) => {
          const peer = peersRef.current[data.answererSocketId];
          if (peer) peer.signal(data.sdp);
        });

        socket.on("user-disconnected", (socketId) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].destroy();
            delete peersRef.current[socketId];
          }
          setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
        });

        socket.on("receive-chat-message", (msg) => {
          setChatMessages((prev) => [...prev, msg]);
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });

    return () => {
      // সেশন লিভ বা কম্পোনেন্ট আনমাউন্ট হলে সবকিছু ক্লিনআপ হবে
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      setPeers([]);
      setStream(null);

      socket.off("user-connected");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("user-disconnected");
      socket.off("receive-chat-message");
    };
  }, [socket, roomId, hasJoined, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket) return;

    const msgData = {
      fileId: roomId,
      senderName: user?.email?.split("@")[0] || "User",
      text: newMsg.trim(),
    };

    socket.emit("send-chat-message", msgData);
    setChatMessages((prev) => [
      ...prev,
      { ...msgData, timestamp: new Date().toISOString() },
    ]);
    setNewMsg("");
  };

  const handleLeaveSession = () => {
    if (confirm("Are you sure you want to leave the live session?")) {
      setHasJoined(false);
      setIsMinimized(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start transition-all duration-300">
      {/* অবস্থা ১: ইউজার এখনো লাইভে জয়েন করেননি */}
      {!hasJoined && (
        <button
          onClick={() => {
            setHasJoined(true);
            setIsMinimized(false);
          }}
          className="bg-[#121217] hover:bg-[#1c1c24] border border-[#d4af37]/40 text-[#d4af37] font-bold text-xs px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span>START LIVE SESSION</span>
        </button>
      )}

      {/* অবস্থা ২: ইউজার লাইভে আছেন কিন্তু উইন্ডোটি মিনিমাইজ করে রেখেছেন (Floating Active Pill) */}
      {hasJoined && isMinimized && (
        <div className="bg-[#121217]/95 border border-green-500/40 backdrop-blur-xl rounded-full p-2 px-4 shadow-2xl flex items-center gap-3 animate-bounce-short">
          {/* এই অংশে ক্লিক করলে ম্যাক্সিমাইজ হবে */}
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 cursor-pointer group"
            title="Maximize Live Session"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-white group-hover:text-[#d4af37] transition-colors">
              Live Active ({peers.length + 1})
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* লিভ বাটন */}
          <button
            onClick={handleLeaveSession}
            className="text-red-400 hover:text-red-500 text-[11px] font-bold transition-colors"
            title="Leave Session"
          >
            Leave
          </button>
        </div>
      )}

      {/* অবস্থা ৩: ইউজার লাইভে আছেন এবং উইন্ডোটি সম্পূর্ণ ম্যাক্সিমাইজড (Full Chat & Video Panel) */}
      {hasJoined && !isMinimized && (
        <div className="w-[350px] bg-[#121217]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* হেডার কন্ট্রোলস */}
          <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-white">
                Live Session ({peers.length + 1})
              </span>
            </div>

            {/* মিনিমাইজ এবং ক্লোজ অ্যাকশনস */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
                title="Minimize Panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button
                onClick={handleLeaveSession}
                className="text-red-400 hover:text-red-200 transition-colors bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-md"
                title="Leave Session"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* ভিডিও বাবলস */}
          <div className="flex flex-wrap gap-2 px-3 pt-3 pointer-events-auto shrink-0">
            {stream && (
              <div className="relative group shrink-0">
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-10 h-10 object-cover rounded-full border border-green-500 shadow-xl bg-black transform scale-x-[-1]"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-semibold">
                  You
                </div>
              </div>
            )}
            {peers.map((peerObj) => (
              <VideoPeer key={peerObj.peerID} peer={peerObj.peer} />
            ))}
          </div>

          {/* চ্যাট এরিয়া */}
          <div className="p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 h-[250px]">
            {chatMessages.length === 0 ? (
              <div className="m-auto text-[10px] text-gray-500 text-center">
                Start the conversation...
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.senderName === (user?.email?.split("@")[0] || "User") ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] text-gray-500 mb-0.5">
                    {msg.senderName}
                  </span>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${msg.senderName === (user?.email?.split("@")[0] || "User") ? "bg-[#d4af37] text-black rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ইনপুট ফিল্ড */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-white/5 bg-black/40 shrink-0"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-[#050505] border border-white/10 rounded-full pl-4 pr-10 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <button
                type="submit"
                disabled={!newMsg.trim()}
                className="absolute right-2 p-1.5 bg-[#d4af37] text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
