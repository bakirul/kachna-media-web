import { getBackendAuthHeaders } from "@/utils/backendAuth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface MediaAssetRecord {
  id: string;
  fileName: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number | null;
  folder: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveMediaAssetInput {
  fileName: string;
  publicUrl: string;
  mimeType: string;
  objectKey?: string;
  userId?: string;
  folder?: string | null;
  fileSize?: number;
}

export interface FetchMediaAssetsParams {
  userId?: string;
  /** Pass "" for vault root (assets with null folder). Omit only when intentionally fetching all. */
  folder?: string;
}

/** Normalizes sidebar folder paths (e.g. "shared/Day_01/") to DB keys ("shared/Day_01"). */
export function normalizeMediaFolder(folder: string): string {
  return folder.replace(/^\/+|\/+$/g, "");
}

export function mediaFolderForSave(folder: string): string | null {
  const normalized = normalizeMediaFolder(folder);
  return normalized || null;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|mxf|mkv|avi)$/i;

export function isMediaAssetVideo(asset: {
  fileName: string;
  mimeType?: string | null;
}): boolean {
  if (asset.mimeType?.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.test(asset.fileName);
}

/** Resolves the CDN playback URL from an R2 / media asset record. */
export function getMediaPlaybackUrl(asset: {
  publicUrl?: string | null;
  url?: string | null;
}): string {
  return (asset.publicUrl ?? asset.url ?? "").trim();
}

export function buildMediaAssetFetchParams(
  currentFolder: string,
  userId?: string,
): FetchMediaAssetsParams {
  return {
    ...(userId ? { userId } : {}),
    folder: normalizeMediaFolder(currentFolder),
  };
}

export interface R2StorageObject {
  key: string;
  fileName: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number | null;
  lastModified: string;
}

export interface FetchR2StorageParams {
  prefix?: string;
  folder?: string;
}

export function mapR2ObjectToMediaAsset(
  object: R2StorageObject,
): MediaAssetRecord {
  return {
    id: object.key,
    fileName: object.fileName,
    publicUrl: object.publicUrl,
    mimeType: object.mimeType,
    fileSize: object.fileSize,
    folder: null,
    userId: null,
    createdAt: object.lastModified,
    updatedAt: object.lastModified,
  };
}

export async function fetchR2StorageList(
  params?: FetchR2StorageParams,
): Promise<MediaAssetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.prefix) searchParams.set("prefix", params.prefix);
  if (params?.folder !== undefined) searchParams.set("folder", params.folder);

  const query = searchParams.toString();
  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${BACKEND_URL}/api/storage/r2/list${query ? `?${query}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch R2 storage list (${res.status})`,
    );
  }

  const data = (await res.json()) as { objects: R2StorageObject[] };
  return data.objects.map(mapR2ObjectToMediaAsset);
}

export async function fetchMediaAssets(
  params?: FetchMediaAssetsParams,
): Promise<MediaAssetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.set("userId", params.userId);
  if (params?.folder !== undefined) searchParams.set("folder", params.folder);

  const query = searchParams.toString();
  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${BACKEND_URL}/api/media/assets${query ? `?${query}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to fetch media assets (${res.status})`,
    );
  }

  const data = (await res.json()) as MediaAssetRecord[];
  return data;
}

export async function saveMediaAsset(
  input: SaveMediaAssetInput,
): Promise<MediaAssetRecord> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/media/assets`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const details = (body as { details?: string }).details;
    throw new Error(
      details ||
        (body as { error?: string }).error ||
        `Failed to save media asset (${res.status})`,
    );
  }

  return res.json();
}
