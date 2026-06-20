import type { CSSProperties } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

export function useGalleryViewStyles() {
  const { viewSettings, viewMode } = useDashboardStore();

  const aspectClass =
    viewSettings.aspectRatio === "video"
      ? "aspect-video"
      : viewSettings.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  const objectFitClass =
    viewSettings.thumbnailScale === "Fill" ? "object-cover" : "object-contain";

  const playerSizeClass =
    viewSettings.aspectRatio === "video"
      ? "w-full h-auto max-h-full"
      : "h-full w-auto max-w-full";

  let containerClass = "grid gap-6";
  let gridStyle: CSSProperties = {};

  if (viewMode === "list") {
    containerClass = "flex flex-col gap-2";
  } else if (viewMode === "grid-sm") {
    gridStyle = { gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" };
  } else {
    gridStyle = { gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" };
  }

  return {
    viewSettings,
    viewMode,
    aspectClass,
    objectFitClass,
    playerSizeClass,
    containerClass,
    gridStyle,
    showCardInfo: viewSettings.showCardInfo,
  };
}
