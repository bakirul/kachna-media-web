"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- APPEARANCE MENU COMPONENT (Polished Theme) ---
const AppearanceMenu = ({
  settings,
  onSettingsChange,
}: {
  settings: any;
  onSettingsChange: (k: string, v: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-[#2a2a35] transition-colors text-white flex items-center gap-2 bg-[#1c1c24] rounded-md"
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
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Appearance</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1c1c24] border border-white/10 p-4 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-md">
          <h4 className="text-[10px] text-gray-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
            View Settings
          </h4>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-300">Thumbnail Scale</span>
              <span className="text-[10px] text-[#a855f7] font-mono bg-[#8b5cf6]/10 px-2 py-0.5 rounded">
                {settings.thumbSize}px
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              value={settings.thumbSize}
              onChange={(e) =>
                onSettingsChange("thumbSize", Number(e.target.value))
              }
              className="w-full accent-[#a855f7] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
            />
          </div>

          <div className="mb-2">
            <span className="text-xs text-gray-300 block mb-2">
              Aspect Ratio
            </span>
            <div className="flex bg-[#121217] rounded-md border border-white/5 p-1 gap-1">
              <button
                onClick={() => onSettingsChange("aspectRatio", "video")}
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === "video" ? "bg-[#2a2a35] text-white font-medium shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                16:9
              </button>
              <button
                onClick={() => onSettingsChange("aspectRatio", "square")}
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === "square" ? "bg-[#2a2a35] text-white font-medium shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                1:1
              </button>
              <button
                onClick={() => onSettingsChange("aspectRatio", "portrait")}
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === "portrait" ? "bg-[#2a2a35] text-white font-medium shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                9:16
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ------------------------------------

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"client" | "admin">("client");

  // --- View Settings State ---
  const [viewSettings, setViewSettings] = useState({
    thumbSize: 180,
    aspectRatio: "video",
  });

  // --- Resizer State (3-Pane Layout) ---
  const [leftPaneWidth, setLeftPaneWidth] = useState(35); // Default 35% width for file grid
  const isResizingLeft = useRef(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");

  const [projectStatus, setProjectStatus] = useState("Awaiting Assets");

  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    isVideo: boolean;
  } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // --- RESIZER LOGIC FOR SPLIT PANE ---
  const handleMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (!isResizingLeft.current) return;
    const container = document.getElementById("main-workspace-container");
    if (container) {
      const rect = container.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth < 20) newWidth = 20; // Min 20%
      if (newWidth > 70) newWidth = 70; // Max 70%
      setLeftPaneWidth(newWidth);
    }
  }, []);

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
  // ---------------------

  // Supabase Data Fetching Logic (Untouched)
  const fetchFiles = useCallback(
    async (userId: string, folderPath: string) => {
      const targetPath = folderPath ? `${userId}/${folderPath}` : userId;
      const { data } = await supabase.storage
        .from("client-vault")
        .list(targetPath, { sortBy: { column: "created_at", order: "desc" } });
      if (data)
        setVaultItems(
          data.filter(
            (item) =>
              item.name !== ".keep" && item.name !== ".emptyFolderPlaceholder",
          ),
        );
    },
    [supabase],
  );

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/access");
        return;
      }
      setUser(session.user);
      await fetchFiles(session.user.id, currentFolder);
      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router, supabase, currentFolder, fetchFiles]);

  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;
    const targetPath = currentFolder
      ? `${user.id}/${currentFolder}/${folderName.trim()}/.keep`
      : `${user.id}/${folderName.trim()}/.keep`;
    const { error } = await supabase.storage
      .from("client-vault")
      .upload(targetPath, new Blob([""]));
    if (!error) fetchFiles(user.id, currentFolder);
  };

  const navigateToFolder = (folderName: string) =>
    setCurrentFolder((prev) => (prev ? `${prev}/${folderName}` : folderName));
  const navigateUp = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    setUploadProgress(10);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetPath = currentFolder
        ? `${user.id}/${currentFolder}`
        : user.id;
      const filePath = `${targetPath}/${Date.now()}_${file.name}`;
      await supabase.storage.from("client-vault").upload(filePath, file);
    }
    setUploadProgress(100);
    fetchFiles(user.id, currentFolder);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 2000);
  };

  const getFilePath = (fileName: string) =>
    currentFolder
      ? `${user.id}/${currentFolder}/${fileName}`
      : `${user.id}/${fileName}`;

  const getSignedUrl = async (fileName: string) => {
    const { data } = await supabase.storage
      .from("client-vault")
      .createSignedUrl(getFilePath(fileName), 604800);
    return data?.signedUrl;
  };

  const handlePreview = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      const isVideo = fileName.match(/\.(mp4|webm|ogg|mov|mxf)$/i) !== null;
      setPreviewFile({ name: fileName, url, isVideo });
      if (isVideo) {
        const { data } = await supabase
          .from("video_comments")
          .select("*")
          .eq("file_name", fileName)
          .order("time_stamp", { ascending: true });
        if (data) setComments(data);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !previewFile || !videoRef.current || !user)
      return;
    const currentTime = videoRef.current.currentTime;
    videoRef.current.pause();
    const { data, error } = await supabase
      .from("video_comments")
      .insert([
        {
          file_name: previewFile.name,
          user_id: user.id,
          time_stamp: currentTime,
          comment_text: newComment.trim(),
        },
      ])
      .select();
    if (!error && data) {
      setComments((prev) =>
        [...prev, data[0]].sort((a, b) => a.time_stamp - b.time_stamp),
      );
      setNewComment("");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#121217] text-[#a855f7] uppercase tracking-widest text-sm font-medium">
        Accessing Vault...
      </div>
    );

  // Dynamic Aspect Ratio Class for Grid Cards Only
  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  return (
    // FULL SCREEN WRAPPER
    <main className="h-screen w-screen bg-[#121217] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* 🌟 TOP NAVIGATION BAR 🌟 */}
      <header className="h-14 bg-[#1c1c24] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#d946ef] flex items-center justify-center text-white font-bold text-xs shadow-lg">
            K
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide">
            Client Vault
          </h1>
        </div>

        {/* Toolbar aligned to right */}
        <div className="flex items-center gap-3">
          <AppearanceMenu
            settings={viewSettings}
            onSettingsChange={(k, v) =>
              setViewSettings((prev) => ({ ...prev, [k]: v }))
            }
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="text-[11px] uppercase tracking-widest bg-[#a855f7] hover:bg-[#9333ea] text-white px-4 py-2 font-bold rounded-md transition-colors shadow-md"
          >
            Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />

          <div className="w-px h-6 bg-white/10 mx-2"></div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/access");
            }}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* 🌟 MAIN WORKSPACE (Split Panes) 🌟 */}
      <div
        id="main-workspace-container"
        className="flex flex-1 overflow-hidden relative"
      >
        {/* PANE 1: ASSET GRID */}
        <section
          className="flex flex-col bg-[#121217] shrink-0 h-full relative"
          style={{ width: previewFile ? `${leftPaneWidth}%` : "100%" }}
        >
          {/* Breadcrumb & Folder Actions */}
          <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-[#121217] shrink-0">
            <div className="flex items-center gap-2">
              {currentFolder && (
                <button
                  onClick={navigateUp}
                  className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className="text-sm font-medium text-gray-200">
                {currentFolder ? currentFolder.split("/").pop() : "All Assets"}
              </h2>
            </div>
            <button
              onClick={handleCreateFolder}
              className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors"
              title="New Folder"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </button>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="w-full bg-[#1c1c24] h-1 shrink-0">
              <div
                className="bg-[#a855f7] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Grid Layout */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {vaultItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p className="text-sm">Drag and drop files here</p>
              </div>
            ) : (
              <div
                className="grid gap-6 transition-all duration-300 ease-in-out"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${viewSettings.thumbSize}px, 1fr))`,
                }}
              >
                {vaultItems.map((item) => {
                  const isFolder = !item.metadata;
                  const originalName = isFolder
                    ? item.name
                    : item.name.substring(item.name.indexOf("_") + 1);
                  const isVideoFile =
                    !isFolder && item.name.match(/\.(mp4|webm|ogg|mov|mxf)$/i);
                  const isSelected = previewFile?.name === item.name;

                  if (isFolder) {
                    return (
                      <div
                        key={item.name}
                        onClick={() => navigateToFolder(item.name)}
                        className={`bg-[#1c1c24] rounded-lg border border-white/5 hover:border-[#a855f7]/50 cursor-pointer p-4 flex flex-col items-center justify-center gap-3 group transition-all shadow-sm hover:shadow-md ${aspectClass}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="#a855f7"
                          className="opacity-80 group-hover:scale-110 transition-transform"
                        >
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="text-xs text-gray-300 text-center truncate w-full font-medium">
                          {originalName}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#1c1c24] rounded-lg border overflow-hidden group relative flex flex-col transition-all shadow-sm hover:shadow-md ${isSelected ? "border-[#a855f7] ring-1 ring-[#a855f7]" : "border-white/5 hover:border-white/20"}`}
                    >
                      {/* Thumbnail Container */}
                      <div
                        className={`w-full bg-[#111116] flex items-center justify-center relative overflow-hidden ${aspectClass}`}
                      >
                        {isVideoFile ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-gray-600"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="20"
                              height="20"
                              rx="2.18"
                              ry="2.18"
                            ></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-gray-600"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <button
                            onClick={() => handlePreview(item.name)}
                            className="w-10 h-10 bg-[#a855f7] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* File Metadata */}
                      <div className="p-3 bg-[#1c1c24] flex flex-col justify-center h-[60px] shrink-0">
                        <p className="text-xs text-gray-200 truncate font-medium">
                          {originalName}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 🌟 DRAGGABLE RESIZER BORDER 🌟 */}
        {previewFile && (
          <div
            onMouseDown={startResizingLeft}
            className="w-[2px] bg-white/5 hover:bg-[#a855f7] hover:w-1 cursor-col-resize z-50 transition-all shrink-0"
            title="Drag to resize panels"
          />
        )}

        {/* 🌟 PANE 2 & 3: VIDEO PLAYER AND COMMENTS 🌟 */}
        {previewFile && (
          <div className="flex flex-1 h-full bg-[#050505] overflow-hidden relative min-w-[40%]">
            {/* PANE 2: Player Container (Takes remaining space dynamically) */}
            <section className="flex-1 relative flex flex-col h-full overflow-hidden">
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* 🌟 VIDEO FIX: Takes full height/width but maintains aspect ratio without cropping 🌟 */}
              <div className="flex-1 w-full h-full flex items-center justify-center p-4">
                {previewFile.isVideo ? (
                  <video
                    ref={videoRef}
                    src={previewFile.url}
                    controls
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                ) : (
                  <img
                    src={previewFile.url}
                    alt="Preview"
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                )}
              </div>
            </section>

            {/* PANE 3: Comments Sidebar (Fixed width) */}
            {previewFile.isVideo && (
              <aside className="w-[320px] bg-[#1c1c24] flex flex-col h-full border-l border-white/5 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] z-10">
                <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0 bg-[#1c1c24]">
                  <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-widest">
                    Comments
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                      No feedback yet.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="bg-[#2a2a35] rounded-lg p-3 shadow-sm"
                      >
                        <button
                          onClick={() => jumpToTime(c.time_stamp)}
                          className="bg-[#8b5cf6]/20 text-[#a855f7] px-2 py-1 rounded text-[10px] font-mono hover:bg-[#8b5cf6]/30 transition-colors font-medium"
                        >
                          {formatTime(c.time_stamp)}
                        </button>
                        <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                          {c.comment_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleAddComment}
                  className="p-4 bg-[#1c1c24] border-t border-white/5 shrink-0"
                >
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a comment..."
                    rows={2}
                    className="w-full bg-[#121217] border border-white/10 rounded-md p-3 text-xs text-white outline-none focus:border-[#a855f7] resize-none mb-3 placeholder-gray-600"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors shadow-md"
                  >
                    Post Comment
                  </button>
                </form>
              </aside>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
