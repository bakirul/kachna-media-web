"use client";
import React from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

interface FileGridProps {
  filteredFiles: any[];
  currentFolder?: string;
  fileUrls: Record<string, string>;
  onPreview: (fileName: string) => void;
  onRenameFile: (fileName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onMoveFile?: (fileName: string) => void;
}

export default function FileGrid({
  filteredFiles,
  currentFolder,
  fileUrls,
  onPreview,
  onRenameFile,
  onDeleteFile,
  onMoveFile,
}: FileGridProps) {
  const { viewSettings, previewFile, viewMode } = useDashboardStore();

  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";

  // Grid styling based on viewMode
  let containerClass = "grid gap-6";
  let gridStyle = {};
  
  if (viewMode === 'list') {
    containerClass = "flex flex-col gap-2";
  } else if (viewMode === 'grid-sm') {
    gridStyle = { gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` };
  } else {
    // grid-lg
    gridStyle = { gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))` };
  }

  return (
    <div className={containerClass} style={gridStyle}>

      {(filteredFiles || []).map((item) => {
        if (!item?.name) return null;
        const originalName = item.name.substring(item.name.indexOf("_") + 1);
        const isVideoFile = item.name.match(/\.(mp4|webm|ogg|mov|mxf)$/i);
        const isImage = item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isSelected = previewFile?.name === item.name;
        const fileUrl = fileUrls?.[item.name];

        if (viewMode === 'list') {
          return (
            <div
              key={item.id}
              className={`bg-[#121217] rounded-md border flex items-center p-2 relative group cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? "border-[#d4af37]" : "border-white/5"}`}
              onClick={() => onPreview(item.name)}
            >
              <div className="w-16 h-10 bg-[#0a0a0f] flex items-center justify-center shrink-0 rounded overflow-hidden mr-4">
                {fileUrl ? (
                  isVideoFile ? (
                    <video crossOrigin="anonymous" src={`${fileUrl}#t=0.5`} className="w-full h-full object-cover" preload="metadata" />
                  ) : isImage ? (
                    <img src={fileUrl} className="w-full h-full object-cover" alt={originalName} />
                  ) : (
                    <div className="text-[10px] text-gray-500">FILE</div>
                  )
                ) : (
                  <div className="w-4 h-4 border border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 truncate">{originalName}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4 pr-2">
                <button onClick={(e) => { e.stopPropagation(); onMoveFile?.(item.name); }} className="p-1.5 text-gray-400 hover:text-[#3b82f6] transition-colors rounded hover:bg-white/10" title="Move">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRenameFile(item.name); }} className="p-1.5 text-gray-400 hover:text-[#d4af37] transition-colors rounded hover:bg-white/10" title="Rename">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteFile(item.name); }} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-500/20" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          );
        }

        // Grid View (sm or lg)
        return (
          <div
            key={item.id}
            className={`bg-[#121217] rounded-lg border overflow-hidden relative group cursor-pointer ${isSelected ? "border-[#d4af37]" : "border-white/5"}`}
            onClick={() => onPreview(item.name)}
          >
            <div
              className={`w-full bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden ${aspectClass}`}
            >
              {fileUrl ? (
                isVideoFile ? (
                  <video
                    crossOrigin="anonymous"
                    src={`${fileUrl}#t=0.5`}
                    className={`w-full h-full ${objectFitClass}`}
                    preload="metadata"
                  />
                ) : isImage ? (
                  <img
                    src={fileUrl}
                    className={`w-full h-full ${objectFitClass}`}
                    alt={originalName}
                  />
                ) : (
                  <div className="text-xs text-gray-500">File</div>
                )
              ) : (
                <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {viewSettings.showCardInfo && (
              <div className="p-3 border-t border-white/5 relative group/card">
                <p className={`truncate pr-16 ${viewMode === 'grid-sm' ? 'text-[10px]' : 'text-xs'}`}>{originalName}</p>
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[#121217] pl-2 rounded-tl-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveFile?.(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-[#3b82f6] transition-colors"
                    title="Move"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFile(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-[#d4af37] transition-colors"
                    title="Rename"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
