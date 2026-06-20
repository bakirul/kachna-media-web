export function getPreviewAssetKey(file: {
  previewKey?: string;
  assetId?: string;
  name: string;
}): string {
  return file.previewKey ?? file.assetId ?? file.name;
}

export function getSelectableAssetPreviewKey(asset: {
  previewKey?: string;
  id: string;
  fileName: string;
}): string {
  return asset.previewKey ?? asset.id ?? asset.fileName;
}
