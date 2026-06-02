// hooks/useFileManager.ts
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export const useFileManager = (user: any, currentFolder: string) => {
  const supabase = createClient();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = useCallback(
    async (userId: string, folderPath: string) => {
      const targetPath = folderPath ? `${userId}/${folderPath}` : userId;
      const { data } = await supabase.storage
        .from("client-vault")
        .list(targetPath, { sortBy: { column: "created_at", order: "desc" } });

      if (data) {
        const filteredFiles = data.filter(
          (item) =>
            item.name !== ".keep" && item.name !== ".emptyFolderPlaceholder",
        );
        setVaultItems(filteredFiles);

        const filesOnly = filteredFiles.filter((item) => item.id);
        if (filesOnly.length > 0) {
          const pathsToSign = filesOnly.map((file) =>
            folderPath
              ? `${userId}/${folderPath}/${file.name}`
              : `${userId}/${file.name}`,
          );
          const { data: signedUrls } = await supabase.storage
            .from("client-vault")
            .createSignedUrls(pathsToSign, 43200);
          if (signedUrls) {
            const urlMap: Record<string, string> = {};
            signedUrls.forEach((item, idx) => {
              if (item.signedUrl) urlMap[filesOnly[idx].name] = item.signedUrl;
            });
            setFileUrls(urlMap);
          }
        } else {
          // ফোল্ডার খালি থাকলে আগের URL গুলো ক্লিয়ার করে দেবে
          setFileUrls({});
        }
      }
    },
    [supabase],
  );

  // 🚀 FIX: পেজ লোড বা ইউজার চেঞ্জ হলে অটোমেটিকভাবে ফাইল ফেচ করবে
  useEffect(() => {
    if (user?.id) {
      fetchFiles(user.id, currentFolder);
    } else {
      setVaultItems([]);
      setFileUrls({});
    }
  }, [user, currentFolder, fetchFiles]);

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
      .createSignedUrl(getFilePath(fileName), 43200);
    return data?.signedUrl;
  };

  const handleDeleteFile = async (
    fileName: string,
    clearPreview: () => void,
  ) => {
    if (
      !window.confirm("Are you sure you want to delete this file permanently?")
    )
      return;
    const filePath = getFilePath(fileName);
    const { error } = await supabase.storage
      .from("client-vault")
      .remove([filePath]);
    if (!error) {
      clearPreview();
      fetchFiles(user.id, currentFolder);
    } else alert("Error deleting file: " + error.message);
  };

  const handleRenameFile = async (
    oldName: string,
    clearPreview: () => void,
  ) => {
    const underscoreIdx = oldName.indexOf("_");
    const prefix =
      underscoreIdx !== -1 ? oldName.substring(0, underscoreIdx + 1) : "";
    const actualNameWithExt =
      underscoreIdx !== -1 ? oldName.substring(underscoreIdx + 1) : oldName;
    const dotIdx = actualNameWithExt.lastIndexOf(".");
    const actualNameOnly =
      dotIdx !== -1
        ? actualNameWithExt.substring(0, dotIdx)
        : actualNameWithExt;
    const ext = dotIdx !== -1 ? actualNameWithExt.substring(dotIdx) : "";

    const newCleanName = prompt(
      "Enter new name for this file:",
      actualNameOnly,
    );
    if (!newCleanName || newCleanName.trim() === "") return;

    const newName = `${prefix}${newCleanName.trim()}${ext}`;
    const oldPath = getFilePath(oldName);
    const newPath = currentFolder
      ? `${user.id}/${currentFolder}/${newName}`
      : `${user.id}/${newName}`;

    const { error } = await supabase.storage
      .from("client-vault")
      .move(oldPath, newPath);
    if (!error) {
      clearPreview();
      fetchFiles(user.id, currentFolder);
    } else alert("Error renaming file: " + error.message);
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;
    const targetPath = currentFolder
      ? `${user.id}/${currentFolder}/${folderName.trim()}/.keep`
      : `${user.id}/${folderName.trim()}/.keep`;
    await supabase.storage
      .from("client-vault")
      .upload(targetPath, new Blob([""]));
    fetchFiles(user.id, currentFolder);
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the folder "${folderName}"? (Make sure it is empty)`,
      )
    )
      return;
    const folderPath = currentFolder
      ? `${user.id}/${currentFolder}/${folderName}`
      : `${user.id}/${folderName}`;
    const { error } = await supabase.storage
      .from("client-vault")
      .remove([`${folderPath}/.keep`]);
    if (!error) fetchFiles(user.id, currentFolder);
    else alert("Could not delete folder. Ensure no other files remain inside.");
  };

  return {
    vaultItems,
    fileUrls,
    uploading,
    uploadProgress,
    fetchFiles,
    handleUpload,
    getSignedUrl,
    handleDeleteFile,
    handleRenameFile,
    handleCreateFolder,
    handleDeleteFolder,
  };
};
