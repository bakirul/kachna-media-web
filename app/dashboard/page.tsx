"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Peer from "simple-peer";

// Hooks
import { useFrameAccurateVideo } from "@/hooks/useFrameAccurateVideo";
import { useLUFSMeter } from "@/hooks/useLUFSMeter";
import { useFileManager } from "@/hooks/useFileManager";
import { useLiveComments } from "@/hooks/useLiveComments";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useDashboardStore } from "@/store/useDashboardStore";

// Components
import Navbar from "@/components/Navbar";
import VaultSidebar from "@/components/VaultSidebar";
import CommentsPanel from "@/components/CommentsPanel";
import LiveSessionWidget from "@/components/LiveSessionWidget";
import DashboardHeader from "@/components/DashboardHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import FileGrid from "@/components/dashboard/FileGrid";
import LUFSMeter from "@/components/LUFSMeter";
import TimelineShareWidget from "@/components/TimelineShareWidget";
import RenameModal from "@/components/modals/RenameModal";
import DeleteModal from "@/components/modals/DeleteModal";
import MoveModal from "@/components/modals/MoveModal";

const setMediaBitrate = (sdp: string, bitrate: number) => {
  let lines = sdp.split('\r\n');
  let mLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('m=video')) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === -1) return sdp;
  let insertIndex = mLineIndex;
  for (let i = mLineIndex; i < lines.length; i++) {
    if (lines[i].startsWith('c=')) {
      insertIndex = i;
      break;
    }
    if (lines[i].startsWith('m=') && i !== mLineIndex) {
      break;
    }
  }
  lines.splice(insertIndex + 1, 0, `b=AS:${bitrate}`);
  return lines.join('\r\n');
};

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(false);

  const {
    viewSettings,
    leftPaneWidth,
    setLeftPaneWidth,
    sidebarWidth,
    setSidebarWidth,
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    currentFolder,
    setCurrentFolder,
    searchQuery,
    setSearchQuery,
    previewFile,
    setPreviewFile,
    compareFile,
    setCompareFile,
    isCompareMode,
    setIsCompareMode,
    isEditor,
    setIsEditor,
    isLiveStreaming,
    setIsLiveStreaming,
    isScreenSharing,
    setIsScreenSharing,
    projectStage,
    setProjectStage
  } = useDashboardStore();

  const isResizingLeft = useRef(false);
  const isResizingSidebar = useRef(false);

  // Sidebar Resize Handlers
  const handleMouseMoveSidebar = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar.current) return;
    let newWidth = e.clientX;
    if (newWidth < 200) newWidth = 200;
    if (newWidth > 600) newWidth = 600;
    setSidebarWidth(newWidth);
  }, [setSidebarWidth]);

  const stopResizingSidebar = useCallback(() => {
    isResizingSidebar.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMoveSidebar);
    document.removeEventListener("mouseup", stopResizingSidebar);
  }, [handleMouseMoveSidebar]);

  const startResizingSidebar = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingSidebar.current = true;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMoveSidebar);
      document.addEventListener("mouseup", stopResizingSidebar);
    },
    [handleMouseMoveSidebar, stopResizingSidebar],
  );

  // Fetch feature flags
  const { flags } = useFeatureFlags(user?.id);

  // Project Progress Logic
  const POST_PROD_STAGES = [
    "Ingest & Sync",
    "Rough Cut",
    "VFX & Color",
    "Sound Mix",
    "Picture Lock",
    "Final Master",
  ];
  const currentStageIndex = POST_PROD_STAGES.indexOf(projectStage);
  const progressPercentage = Math.round(
    ((currentStageIndex + 1) / POST_PROD_STAGES.length) * 100,
  );

  const [isLocked, setIsLocked] = useState(false);
  const [integrityHash, setIntegrityHash] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const compareVideoRef = useRef<HTMLVideoElement>(null);

  // File Manager Hook
  const {
    vaultItems,
    fileUrls,
    uploading,
    allFolders,
    handleUpload,
    getSignedUrl,
    handleDeleteFile,
    handleRenameFile,
    handleMoveFile,
    handleCreateFolder,
    handleDeleteFolder,
  } = useFileManager(user, currentFolder);

  const [renameModalState, setRenameModalState] = useState<{ isOpen: boolean; itemName: string; isFolder: boolean }>({ isOpen: false, itemName: "", isFolder: false });
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; itemName: string; isFolder: boolean }>({ isOpen: false, itemName: "", isFolder: false });
  const [moveModalState, setMoveModalState] = useState<{ isOpen: boolean; itemName: string }>({ isOpen: false, itemName: "" });

  // Live Comments Hook
  const {
    comments,
    setComments,
    newComment,
    setNewComment,
    socket,
    isLive,
    isNotifying,
    notificationSent,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleNotifyTeam,
    handleCompileAndSend,
    handleDownloadReport,
    jumpToTime,
  } = useLiveComments(user, previewFile, videoRef, currentFolder);

  // Over-the-Shoulder (OTS) Screen Share Refs
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenPeersRef = useRef<{ [socketId: string]: any }>({});
  const clientScreenPeerRef = useRef<any>(null);
  const cinemaVideoRef = useRef<HTMLVideoElement>(null);
  const clientAudioStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false, // Set to false to avoid hardware stream locks with LiveSessionWidget's getUserMedia
      });

      // Constraints optimized for zero-latency voice talkback
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      let audioStream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      } catch (err) {
        console.warn("Could not get admin audio:", err);
      }

      const tracks = [...displayStream.getVideoTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }
      const stream = new MediaStream(tracks);

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setIsLiveStreaming(true);

      setTimeout(() => {
        if (cinemaVideoRef.current) {
          cinemaVideoRef.current.srcObject = stream;
        }
      }, 100);

      const globalRoomId = previewFile?.name || currentFolder || "global-lobby";
      if (socket) {
        // Emit explicit socket event to global room to force client UI switch
        socket.emit("admin-started-timeline-share", { 
          roomId: globalRoomId,
          editorSocketId: socket.id 
        });
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Failed to start screen share:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    Object.values(screenPeersRef.current).forEach((peer: any) => peer.destroy());
    screenPeersRef.current = {};

    setIsScreenSharing(false);
    setIsLiveStreaming(false);

    const globalRoomId = previewFile?.name || currentFolder || "global-lobby";
    if (socket) {
      socket.emit("admin-stopped-timeline-share", { roomId: globalRoomId });
    }
  };

  // Screen Share WebRTC Signaling Effect
  useEffect(() => {
    if (!socket) return;

    const handleAdminStartedShare = (data: { roomId: string; editorSocketId: string }) => {
      console.log("[DEBUG: Socket Rx] admin-started-timeline-share received", data);
      console.log("Admin started timeline share, forcing UI switch to Cinema Mode");
      setIsLiveStreaming(true); // Force UI switch BEFORE WebRTC negotiation
      socket.emit("timeline-client-ready", {
        targetSocketId: data.editorSocketId,
        roomId: `timeline-${data.roomId}`,
      });
    };

    const handleAdminStoppedShare = () => {
      console.log("Admin stopped timeline share, returning to file grid");
      setIsLiveStreaming(false); // Force UI switch back to file grid
      if (clientScreenPeerRef.current) {
        clientScreenPeerRef.current.destroy();
        clientScreenPeerRef.current = null;
      }
      if (cinemaVideoRef.current) {
        cinemaVideoRef.current.srcObject = null;
      }
      if (clientAudioStreamRef.current) {
        clientAudioStreamRef.current.getTracks().forEach(track => track.stop());
        clientAudioStreamRef.current = null;
      }
    };

    const handleClientReady = (data: { clientSocketId: string }) => {
      if (!screenStreamRef.current) return;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: screenStreamRef.current,
      });

      peer.on("signal", (signal: any) => {
        if (signal.type === "offer" || signal.type === "answer") {
          signal.sdp = setMediaBitrate(signal.sdp, 2500);
        }
        socket.emit("timeline-webrtc-offer", {
          targetSocketId: data.clientSocketId,
          sdp: signal,
        });
      });

      peer.on("stream", (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch(e => console.error("Admin audio play error:", e));
      });

      peer.on("close", () => {
        peer.destroy();
        delete screenPeersRef.current[data.clientSocketId];
      });

      peer.on("error", (err) => {
        console.error("Sender screen peer error:", err);
      });

      screenPeersRef.current[data.clientSocketId] = peer;
    };

    const handleScreenOffer = async (data: { callerSocketId: string; sdp: any }) => {
      let localAudioStream = clientAudioStreamRef.current;
      if (!localAudioStream) {
        try {
          // Constraints optimized for zero-latency voice talkback
          const audioConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          localAudioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
          clientAudioStreamRef.current = localAudioStream;
        } catch (err) {
          console.warn("Could not get client audio:", err);
        }
      }

      const peerOptions: any = {
        initiator: false,
        trickle: false,
      };
      if (localAudioStream) {
        peerOptions.stream = localAudioStream;
      }
      const peer = new Peer(peerOptions);

      // @ts-ignore
      peer.on('iceConnectionStateChange', () => {
        // @ts-ignore
        console.log("[DEBUG: ICE State] ICE Connection State Change (event):", peer.iceConnectionState || "unknown");
      });
      // @ts-ignore
      if (peer._pc) {
        // @ts-ignore
        peer._pc.addEventListener('iceconnectionstatechange', () => {
          // @ts-ignore
          console.log("[DEBUG: ICE State] ICE Connection State Change (native):", peer._pc.iceConnectionState);
        });
      }

      peer.on("signal", (signal: any) => {
        if (signal.type === "offer" || signal.type === "answer") {
          signal.sdp = setMediaBitrate(signal.sdp, 2500);
        }
        socket.emit("timeline-webrtc-answer", {
          targetSocketId: data.callerSocketId,
          sdp: signal,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("[DEBUG: WebRTC Stream] Stream Received:", remoteStream);
        console.log("[DEBUG: Ref Check] State of cinemaVideoRef.current:", cinemaVideoRef.current);
        // UI is already mounted by admin-started-timeline-share, just attach stream safely
        const attachStream = () => {
          if (cinemaVideoRef.current) {
            cinemaVideoRef.current.srcObject = remoteStream;
            cinemaVideoRef.current.play().catch(err => console.error("Client stream play error:", err));
          } else {
            setTimeout(attachStream, 100);
          }
        };
        attachStream();
      });

      peer.on("close", () => {
        peer.destroy();
        if (clientScreenPeerRef.current === peer) {
          clientScreenPeerRef.current = null;
          // UI state is handled by admin-stopped-timeline-share, NOT here.
        }
      });

      peer.on("error", (err) => {
        console.error("Receiver screen peer error:", err);
      });

      peer.signal(data.sdp);
      clientScreenPeerRef.current = peer;
    };

    const handleScreenAnswer = (data: { answererSocketId: string; sdp: any }) => {
      const peer = screenPeersRef.current[data.answererSocketId];
      if (peer) {
        peer.signal(data.sdp);
      }
    };

    const handleUserDisconnected = (socketId: string) => {
      const peer = screenPeersRef.current[socketId];
      if (peer) {
        peer.destroy();
        delete screenPeersRef.current[socketId];
      }
    };

    socket.on("admin-started-timeline-share", handleAdminStartedShare);
    socket.on("admin-stopped-timeline-share", handleAdminStoppedShare);
    socket.on("timeline-client-ready", handleClientReady);
    socket.on("timeline-webrtc-offer", handleScreenOffer);
    socket.on("timeline-webrtc-answer", handleScreenAnswer);
    socket.on("timeline-user-disconnected", handleUserDisconnected);

    return () => {
      socket.off("admin-started-timeline-share", handleAdminStartedShare);
      socket.off("admin-stopped-timeline-share", handleAdminStoppedShare);
      socket.off("timeline-client-ready", handleClientReady);
      socket.off("timeline-webrtc-offer", handleScreenOffer);
      socket.off("timeline-webrtc-answer", handleScreenAnswer);
      socket.off("timeline-user-disconnected", handleUserDisconnected);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (clientAudioStreamRef.current) {
        clientAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(screenPeersRef.current).forEach((peer: any) => peer.destroy());
      if (clientScreenPeerRef.current) {
        clientScreenPeerRef.current.destroy();
      }
    };
  }, []);

  const { smpteTimecode, stepForward, stepBackward } = useFrameAccurateVideo(
    videoRef,
    24,
  );
  const { lufs } = useLUFSMeter(videoRef, previewFile?.url);

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth >= 768);
  }, [setIsSidebarOpen]);

  // User Auth Initializer & Strict RBAC
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (isMounted && currentUser) {
        setUser(currentUser);
        setLoading(false);
        const editorCheck = currentUser.app_metadata?.role === "admin" || currentUser.app_metadata?.role === "editor";
        setIsEditor(editorCheck);
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [supabase, setIsEditor]);

  // Sync main and compare video elements
  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .catch((e) => console.error("Main Video Play Error:", e));
      if (
        flags?.enable_compare_mode &&
        isCompareMode &&
        compareVideoRef.current
      ) {
        compareVideoRef.current
          .play()
          .catch((e) => console.error("Compare Video Play Error:", e));
      }
    } else {
      videoRef.current.pause();
      if (
        flags?.enable_compare_mode &&
        isCompareMode &&
        compareVideoRef.current
      ) {
        compareVideoRef.current.pause();
      }
    }
  }, [flags, isCompareMode]);

  useEffect(() => {
    const main = videoRef.current;
    const comp = compareVideoRef.current;
    if (!main || !comp || !isCompareMode || !flags?.enable_compare_mode) return;

    const syncPlay = () => {
      if (comp.paused) comp.play().catch((e) => console.error(e));
    };
    const syncPause = () => {
      if (!comp.paused) comp.pause();
    };
    const syncSeek = () => {
      comp.currentTime = main.currentTime;
    };
    const syncRate = () => {
      comp.playbackRate = main.playbackRate;
    };

    main.addEventListener("play", syncPlay);
    main.addEventListener("pause", syncPause);
    main.addEventListener("seeked", syncSeek);
    main.addEventListener("ratechange", syncRate);

    return () => {
      main.removeEventListener("play", syncPlay);
      main.removeEventListener("pause", syncPause);
      main.removeEventListener("seeked", syncSeek);
      main.removeEventListener("ratechange", syncRate);
    };
  }, [isCompareMode, compareFile, previewFile, flags]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || !previewFile?.isVideo) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      if (e.key === ",") {
        e.preventDefault();
        stepBackward();
      } else if (e.key === ".") {
        e.preventDefault();
        stepForward();
      } else if (e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile, stepBackward, stepForward, isCompareMode, flags, handleTogglePlay]);

  // Resize handlers
  const handleMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (!isResizingLeft.current) return;
    const container = document.getElementById("grid-preview-container");
    if (container) {
      const rect = container.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 70) newWidth = 70;
      setLeftPaneWidth(newWidth);
    }
  }, [setLeftPaneWidth]);

  const stopResizingLeft = useCallback(() => {
    isResizingLeft.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMoveLeft);
    document.removeEventListener("mouseup", stopResizingLeft);
  }, [handleMouseMoveLeft]);

  const startResizingLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingLeft.current = true;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMoveLeft);
      document.addEventListener("mouseup", stopResizingLeft);
    },
    [handleMouseMoveLeft, stopResizingLeft],
  );

  const handlePreview = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null;
      setPreviewFile({ name: fileName, url, isVideo });
      setIsCompareMode(false);
      setCompareFile(null);

      if (isVideo) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", fileName)
          .order("time_stamp", { ascending: true });
        if (data) setComments(data);

        const { data: lockData } = await supabase
          .from("video_metadata")
          .select("*")
          .eq("file_name", fileName)
          .single();
        if (lockData && lockData.is_locked) {
          setIsLocked(true);
          setIntegrityHash(lockData.integrity_hash);
        } else {
          setIsLocked(false);
          setIntegrityHash(null);
        }
      }
    }
  };

  const handleSelectCompare = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const fileName = e.target.value;
    if (!fileName) {
      setIsCompareMode(false);
      setCompareFile(null);
      return;
    }
    const url = await getSignedUrl(fileName);
    if (url) {
      setCompareFile({ name: fileName, url });
      setIsCompareMode(true);
    }
  };

  const handlePictureLock = async () => {
    if (!previewFile || !user || !videoRef.current) return;
    if (
      window.confirm(
        "WARNING: Applying Picture Lock will generate an immutable SHA-256 hash. No further frame changes will be accepted. Proceed?",
      )
    ) {
      setIsLocking(true);
      try {
        const res = await fetch("/api/picture-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: previewFile.name,
            userId: user.id,
            duration: videoRef.current.duration,
            frameRate: 24,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsLocked(true);
          setIntegrityHash(result.hash);
          alert("PICTURE LOCK SECURED.\nIntegrity Hash: " + result.hash);
        } else {
          alert("Lock Failed: " + result.error);
        }
      } catch (err) {
        console.error("Lock error:", err);
      } finally {
        setIsLocking(false);
      }
    }
  };

  const onDeleteFile = (fileName: string) => setDeleteModalState({ isOpen: true, itemName: fileName, isFolder: false });
  const onRenameFile = (fileName: string) => setRenameModalState({ isOpen: true, itemName: fileName, isFolder: false });
  const onMoveFile = (fileName: string) => setMoveModalState({ isOpen: true, itemName: fileName });
  const onDeleteFolderUI = (folderName: string) => setDeleteModalState({ isOpen: true, itemName: folderName, isFolder: true });

  const folders = (vaultItems || []).filter((item) => !item?.metadata);
  const files = (vaultItems || []).filter((item) => item?.metadata);
  const filteredFiles = (files || []).filter((item) => {
    if (!item?.name) return false;
    const originalName = item.name
      .substring(item.name.indexOf("_") + 1)
      .toLowerCase();
    return originalName.includes((searchQuery || "").toLowerCase());
  });
  const allVideoFiles = (files || []).filter(
    (f) => f?.name?.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null,
  );

  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  const playerSizeClass =
    viewSettings.aspectRatio === "video"
      ? "w-full h-auto max-h-full"
      : "h-full w-auto max-w-full";

  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";

  return (
    <main className="h-screen w-full bg-[#050505] text-gray-300 font-sans flex flex-col overflow-hidden relative">
      <div
        className="fixed top-0 left-0 right-0 h-2 z-[55]"
        onMouseEnter={() => setShowNavbar(true)}
      />

      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out transform ${
          showNavbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        } bg-[#050505] border-b border-white/5`}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <Navbar />
      </div>

      <DashboardHeader
        handleUpload={handleUpload}
        uploading={uploading}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
      />



      <div
        id="main-workspace-container"
        className="flex flex-1 overflow-hidden relative min-h-0"
      >
        {isLiveStreaming ? (
          <TimelineShareWidget cinemaVideoRef={cinemaVideoRef} socket={socket} isEditor={isEditor} />
        ) : (
          <>
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <div
              className={`
                fixed md:relative inset-y-0 left-0 z-40 md:z-20
                h-full shrink-0 bg-[#0a0a0f] border-r border-white/5
                ${isSidebarOpen && !isResizingSidebar.current ? "transition-all duration-300 ease-in-out" : ""}
                ${isSidebarOpen 
                  ? "translate-x-0 opacity-100" 
                  : "md:w-0 -translate-x-full md:translate-x-0 md:opacity-0 overflow-hidden md:border-r-0 pointer-events-none"
                }
              `}
              style={{ width: isSidebarOpen ? (typeof window !== "undefined" && window.innerWidth >= 768 ? sidebarWidth + "px" : "240px") : "0px" }}
            >
              <VaultSidebar
                currentFolder={currentFolder}
                folders={folders}
                onFolderClick={setCurrentFolder}
                onRootClick={() => setCurrentFolder("")}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={onDeleteFolderUI}
              />
              <div
                onMouseDown={startResizingSidebar}
                className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#d4af37]/50 active:bg-[#d4af37] z-50 hidden md:block transition-colors"
              />
            </div>

            <div
              id="grid-preview-container"
              className="flex flex-1 overflow-hidden relative"
            >
              <section
                className={`flex flex-col bg-[#050505] shrink-0 h-full relative transition-none custom-scrollbar ${previewFile ? "hidden lg:flex" : "flex"}`}
                style={{ width: `${leftPaneWidth}%` }}
              >
                <div className="w-full h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#121217] shrink-0 z-20 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-200 whitespace-nowrap">
                      {currentFolder
                        ? currentFolder.split("/").pop()
                        : "All Assets"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#050505] border border-white/10 rounded-md p-0.5 shadow-inner">
                      <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="List View">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                      </button>
                      <button onClick={() => setViewMode('grid-sm')} className={`p-1.5 rounded transition-all ${viewMode === 'grid-sm' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="Small Grid">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      </button>
                      <button onClick={() => setViewMode('grid-lg')} className={`p-1.5 rounded transition-all ${viewMode === 'grid-lg' ? 'bg-white/10 text-[#d4af37] shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="Large Grid">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="21"></line></svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#050505] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white w-full max-w-[200px]"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <FileGrid
                    filteredFiles={filteredFiles}
                    folders={folders}
                    currentFolder={currentFolder}
                    onFolderClick={setCurrentFolder}
                    fileUrls={fileUrls}
                    onPreview={handlePreview}
                    onRenameFile={onRenameFile}
                    onDeleteFile={onDeleteFile}
                    onMoveFile={onMoveFile}
                  />
                </div>
              </section>

              <div
                onMouseDown={startResizingLeft}
                className="w-[3px] bg-white/5 hover:bg-[#d4af37] cursor-col-resize z-50 shrink-0 hidden lg:block"
              />

              <div className={`flex flex-1 flex-col h-full bg-[#0a0a0f] overflow-hidden relative min-w-0 ${!previewFile ? "hidden lg:flex" : "flex"}`}>
                {previewFile ? (
                  <>
                    {previewFile.isVideo && (
                      <div className="w-full bg-[#1c1c24] border-b border-[#d4af37]/20 p-2 lg:p-3 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between z-30 shrink-0 shadow-md gap-3">
                      <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                        <button
                          onClick={() => setPreviewFile(null)}
                          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors border border-white/10"
                          title="Close Preview"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                        <div className="w-px h-5 bg-white/10 shrink-0"></div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest hidden md:inline">
                            Phase:
                          </span>
                          <select
                            value={projectStage}
                            onChange={(e) => setProjectStage(e.target.value)}
                            className="bg-[#121217] text-[#d4af37] text-[10px] font-bold px-2 py-1 rounded border border-white/10 outline-none cursor-pointer"
                          >
                            {POST_PROD_STAGES.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest hidden sm:inline">
                            Project Progress:
                          </span>
                          <div
                            className="w-20 sm:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden flex"
                            title={`${projectStage} (${progressPercentage}%)`}
                          >
                            <div
                              className="h-full bg-[#d4af37] transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] text-[#d4af37] font-bold ml-1">
                            {progressPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0 shrink-0">
                        {flags?.enable_compare_mode && (
                          <>
                            <select
                              onChange={handleSelectCompare}
                              defaultValue=""
                              className="bg-[#121217] text-[#d4af37] text-[10px] px-2 py-1 rounded border border-white/10 outline-none cursor-pointer max-w-[100px] sm:max-w-[120px] truncate shrink-0"
                            >
                              <option value="">Compare...</option>
                              {allVideoFiles
                                .filter((f) => f.name !== previewFile.name)
                                .map((f) => (
                                  <option key={f.id} value={f.name}>
                                    {f.name.substring(f.name.indexOf("_") + 1)}
                                  </option>
                                ))}
                            </select>
                            <div className="w-px h-5 bg-white/10 mx-1 shrink-0"></div>
                          </>
                        )}

                        {flags?.enable_picture_lock && (
                          <>
                            {isLocked ? (
                              <div
                                className="flex items-center gap-1 text-green-400 bg-green-900/20 border border-green-500/30 px-2 py-1 rounded shrink-0"
                                title={`SHA-256: ${integrityHash}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M19 11h-1V7a6 6 0 0 0-12 0v4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2zm-7 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-8H9V7a3 3 0 0 1 6 0v4z" />
                                </svg>
                                <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                                  Locked
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={handlePictureLock}
                                disabled={isLocking}
                                className="flex items-center gap-1 text-red-400 hover:text-white transition-colors bg-red-900/20 hover:bg-red-800/40 border border-red-500/30 px-2 py-1 rounded shrink-0"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                                  {isLocking ? "Locking..." : "Lock"}
                                </span>
                              </button>
                            )}
                            <div className="w-px h-5 bg-white/10 mx-1 shrink-0"></div>
                          </>
                        )}

                        <button
                          onClick={handleDownloadReport}
                          className="text-[9px] uppercase font-bold tracking-widest bg-[#121217] border border-white/10 hover:border-[#d4af37] text-white px-2 py-1.5 rounded transition-colors shrink-0"
                        >
                          Report
                        </button>
                        <button
                          onClick={handleCompileAndSend}
                          disabled={isNotifying}
                          className="text-[9px] uppercase font-bold tracking-widest bg-[#d4af37] hover:bg-[#b8952b] text-black px-2 py-1.5 rounded transition-colors shadow-md shrink-0"
                        >
                          {isNotifying ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}

                  <section className="flex-1 w-full flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-hidden custom-scrollbar min-h-0">
                    <div className="flex-1 flex flex-row min-w-0 lg:overflow-hidden min-h-[40vh] lg:min-h-0 shrink-0">
                      <div className="flex-1 flex flex-col p-2 lg:p-4 overflow-hidden relative min-w-0">
                        {previewFile.isVideo ? (
                          <>
                            <div
                              className={`flex flex-1 w-full h-full justify-center items-center ${flags?.enable_compare_mode && isCompareMode ? "flex-col sm:flex-row gap-4" : "flex-col"} min-h-0 min-w-0 pb-4`}
                            >
                              <div
                                className={`relative flex flex-col items-center justify-center min-h-0 min-w-0 overflow-hidden ${playerSizeClass} ${aspectClass}`}
                              >
                                {flags?.enable_compare_mode && isCompareMode && (
                                  <span className="absolute top-2 left-2 bg-black/80 text-[#d4af37] text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                    V2 (Current)
                                  </span>
                                )}
                                <video
                                  ref={videoRef}
                                  src={previewFile.url}
                                  crossOrigin="anonymous"
                                  controls={
                                    !(flags?.enable_compare_mode && isCompareMode)
                                  }
                                  className={`w-full h-full bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                                />
                              </div>

                              {flags?.enable_compare_mode &&
                                isCompareMode &&
                                compareFile && (
                                  <div
                                    className={`relative flex flex-col items-center justify-center min-h-0 min-w-0 overflow-hidden ${playerSizeClass} ${aspectClass}`}
                                  >
                                    <span className="absolute top-2 left-2 bg-black/80 text-gray-300 text-[10px] px-2 py-1 rounded backdrop-blur border border-white/10 z-10 font-bold tracking-widest shadow-lg">
                                      V1 (Reference)
                                    </span>
                                    <video
                                      ref={compareVideoRef}
                                      src={compareFile.url}
                                      crossOrigin="anonymous"
                                      muted
                                      controls={false}
                                      className={`w-full h-full bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg border border-white/10 ${objectFitClass}`}
                                    />
                                  </div>
                                )}
                            </div>

                            <div className="shrink-0 mx-auto flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-[#121217] border border-white/10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl text-xs select-none relative z-20 w-full max-w-2xl">
                              <div className="hidden sm:flex items-center gap-2">
                                <span className="text-gray-500 text-[10px] uppercase font-semibold">
                                  Speed:
                                </span>
                                <select
                                  onChange={(e) => {
                                    if (videoRef.current)
                                      videoRef.current.playbackRate = parseFloat(
                                        e.target.value,
                                      );
                                  }}
                                  defaultValue="1"
                                  className="bg-[#050505] border border-white/10 rounded px-2 py-0.5 text-white text-[11px] outline-none cursor-pointer"
                                >
                                  <option value="0.5">0.5x</option>
                                  <option value="1">1.0x</option>
                                  <option value="2">2.0x</option>
                                </select>
                              </div>
                              <div className="hidden sm:block w-px h-4 bg-white/10"></div>

                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={stepBackward}
                                  className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded"
                                >
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 19l-7-7 7-7"
                                    />
                                  </svg>
                                </button>
                                <div className="font-mono text-[10px] sm:text-[11px] text-[#d4af37] font-medium tracking-widest px-2 py-1 bg-[#050505] rounded border border-white/10">
                                  {smpteTimecode}
                                </div>
                                <button
                                  onClick={stepForward}
                                  className="px-2 py-1 bg-[#050505] hover:bg-[#d4af37]/20 border border-white/5 hover:border-[#d4af37]/30 text-gray-300 hover:text-[#d4af37] rounded"
                                >
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              </div>

                              <div className="w-px h-4 bg-white/10"></div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (videoRef.current)
                                      videoRef.current.currentTime = Math.max(
                                        0,
                                        videoRef.current.currentTime - 5,
                                      );
                                  }}
                                  className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono"
                                >
                                  -5s
                                </button>
                                <button
                                  onClick={() => {
                                    if (videoRef.current)
                                      videoRef.current.currentTime = Math.min(
                                        videoRef.current.duration,
                                        videoRef.current.currentTime + 5,
                                      );
                                  }}
                                  className="px-1 sm:px-2 py-1 bg-[#050505] border border-white/5 hover:text-white rounded text-[9px] sm:text-[10px] font-mono"
                                >
                                  +5s
                                </button>
                              </div>

                              <div className="w-px h-4 bg-white/10"></div>

                              <button
                                onClick={handleTogglePlay}
                                className="px-3 sm:px-4 py-1.5 bg-[#d4af37] text-black font-bold text-[9px] sm:text-[10px] uppercase rounded-full tracking-widest hover:scale-105 transition-transform shadow-md truncate"
                              >
                                Play / Pause
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex justify-center items-center pb-4 min-h-0 min-w-0">
                            <img
                              src={previewFile.url}
                              className={`bg-black rounded shadow-2xl border border-white/5 ${playerSizeClass} ${aspectClass} ${objectFitClass}`}
                            />
                          </div>
                        )}
                      </div>

                      {previewFile.isVideo && (
                        <div className="shrink-0 w-16 h-full hidden md:flex flex-col justify-center border-l border-white/5 bg-[#0a0a0f] p-2 z-20">
                          <LUFSMeter lufs={lufs} />
                        </div>
                      )}
                    </div>

                      {previewFile.isVideo && (
                        <div className="w-full lg:w-[320px] shrink-0 bg-[#121217] border-t lg:border-t-0 lg:border-l border-white/5 z-40 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full">
                          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                            <CommentsPanel
                              isLive={isLive}
                              comments={comments}
                              newComment={newComment}
                              setNewComment={setNewComment}
                              handleAddComment={handleAddComment}
                              handleEditComment={handleEditComment}
                              handleDeleteComment={handleDeleteComment}
                              handleNotifyTeam={handleNotifyTeam}
                              isNotifying={isNotifying}
                              notificationSent={notificationSent}
                              jumpToTime={jumpToTime}
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 bg-[#0a0a0f] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                    <span className="text-6xl mb-6 opacity-20 drop-shadow-2xl">🎞️</span>
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500/50">Select an asset to preview</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    <RenameModal
        isOpen={renameModalState.isOpen}
        onClose={() => setRenameModalState({ isOpen: false, itemName: "", isFolder: false })}
        onConfirm={(newName) => {
          handleRenameFile(renameModalState.itemName, newName, () => {
            if (previewFile?.name === renameModalState.itemName) setPreviewFile(null);
          });
          setRenameModalState({ isOpen: false, itemName: "", isFolder: false });
        }}
        currentName={(() => {
          const name = renameModalState.itemName;
          const underscoreIdx = name.indexOf("_");
          const actualNameWithExt = underscoreIdx !== -1 ? name.substring(underscoreIdx + 1) : name;
          const dotIdx = actualNameWithExt.lastIndexOf(".");
          return dotIdx !== -1 ? actualNameWithExt.substring(0, dotIdx) : actualNameWithExt;
        })()}
      />
      
      <DeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, itemName: "", isFolder: false })}
        onConfirm={() => {
          if (deleteModalState.isFolder) {
            handleDeleteFolder(deleteModalState.itemName);
          } else {
            handleDeleteFile(deleteModalState.itemName, () => {
              if (previewFile?.name === deleteModalState.itemName) setPreviewFile(null);
            });
          }
          setDeleteModalState({ isOpen: false, itemName: "", isFolder: false });
        }}
        assetName={(() => {
          const name = deleteModalState.itemName;
          if (deleteModalState.isFolder) return name;
          const underscoreIdx = name.indexOf("_");
          return underscoreIdx !== -1 ? name.substring(underscoreIdx + 1) : name;
        })()}
        isFolder={deleteModalState.isFolder}
      />

      <MoveModal
        isOpen={moveModalState.isOpen}
        onClose={() => setMoveModalState({ isOpen: false, itemName: "" })}
        onConfirm={(dest) => {
          handleMoveFile(moveModalState.itemName, dest, () => {
            if (previewFile?.name === moveModalState.itemName) setPreviewFile(null);
          });
          setMoveModalState({ isOpen: false, itemName: "" });
        }}
        currentPath={currentFolder}
        folders={allFolders}
      />
    </main>
  );
}
