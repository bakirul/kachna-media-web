// hooks/useFileManager.ts
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export const useFileManager = (user: any, currentFolder: string) => {
  const supabase = createClient();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allFolders, setAllFolders] = useState<string[]>([]);

  const fetchAllFolders = useCallback(async () => {
    const folders: string[] = [];
    const getFolders = async (path: string, prefix: string) => {
      const { data } = await supabase.storage.from("client-vault").list(path);
      if (data) {
        for (const item of data) {
          if (!item.id && item.name !== ".emptyFolderPlaceholder" && item.name !== ".keep") {
            const folderPath = prefix ? `${prefix}/${item.name}` : item.name;
            folders.push(folderPath);
            await getFolders(`${path}/${item.name}`, folderPath);
          }
        }
      }
    };
    await getFolders("shared", "");
    setAllFolders(folders);
  }, [supabase]);

  const fetchFiles = useCallback(
    async (userId: string, folderPath: string) => {
      const targetPath = folderPath ? `shared/${folderPath}` : "shared";
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
              ? `shared/${folderPath}/${file.name}`
              : `shared/${file.name}`,
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

  useEffect(() => {
    if (user?.id) {
      fetchFiles(user.id, currentFolder);
      fetchAllFolders();
    } else {
      setVaultItems([]);
      setFileUrls({});
      setAllFolders([]);
    }
  }, [user, currentFolder, fetchFiles, fetchAllFolders]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    setUploadProgress(0);

    // Get the current session for auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Authentication error: No active session found.");
      setUploading(false);
      return;
    }

    // Process multiple files one by one or concurrently
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetPath = currentFolder
        ? `shared/${currentFolder}`
        : "shared";
      const filePath = `${targetPath}/${Date.now()}_${file.name}`;

      // Import the TUS uploader dynamically to avoid SSR issues
      const { ChunkUploader } = await import("@/utils/chunkUploader");

      const uploader = new ChunkUploader({
        file: file,
        bucketName: "client-vault", // Your Supabase bucket name
        filePath: filePath,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        userAccessToken: session.access_token,
        onProgress: (percentage, bytesUploaded, bytesTotal) => {
          // Update UI state with overall progress
          setUploadProgress(percentage);
          console.log(
            `[Upload] ${percentage}% (${bytesUploaded}/${bytesTotal} bytes)`,
          );
        },
        onSuccess: () => {
          setUploadProgress(100);
          fetchFiles(user.id, currentFolder); // Refresh file list
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
          }, 2000);
        },
        onError: (error) => {
          alert(`Upload failed: ${error.message}`);
          setUploading(false);
          setUploadProgress(0);
        },
      });

      // Start the resilient TUS upload
      uploader.startUpload();
    }
  };

  const getFilePath = (fileName: string) =>
    currentFolder
      ? `shared/${currentFolder}/${fileName}`
      : `shared/${fileName}`;

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
    const filePath = getFilePath(fileName);
    const { error } = await supabase.storage
      .from("client-vault")
      .remove([filePath]);
    if (!error) {
      clearPreview();
      fetchFiles(user.id, currentFolder);
      fetchAllFolders();
    } else alert("Error deleting file: " + error.message);
  };

  const handleRenameFile = async (
    oldName: string,
    newCleanName: string,
    clearPreview: () => void,
  ) => {
    const underscoreIdx = oldName.indexOf("_");
    const prefix =
      underscoreIdx !== -1 ? oldName.substring(0, underscoreIdx + 1) : "";
    const actualNameWithExt =
      underscoreIdx !== -1 ? oldName.substring(underscoreIdx + 1) : oldName;
    const dotIdx = actualNameWithExt.lastIndexOf(".");
    const ext = dotIdx !== -1 ? actualNameWithExt.substring(dotIdx) : "";

    const newName = `${prefix}${newCleanName.trim()}${ext}`;
    const oldPath = getFilePath(oldName);
    const newPath = currentFolder
      ? `shared/${currentFolder}/${newName}`
      : `shared/${newName}`;

    const { error } = await supabase.storage
      .from("client-vault")
      .move(oldPath, newPath);
    if (!error) {
      clearPreview();
      fetchFiles(user.id, currentFolder);
    } else alert("Error renaming file: " + error.message);
  };

  const handleMoveFile = async (
    fileName: string,
    destinationFolder: string,
    clearPreview: () => void,
  ) => {
    const oldPath = getFilePath(fileName);
    const newPath = destinationFolder
      ? `shared/${destinationFolder}/${fileName}`
      : `shared/${fileName}`;

    if (oldPath === newPath) return;

    const { error } = await supabase.storage
      .from("client-vault")
      .move(oldPath, newPath);
    if (!error) {
      clearPreview();
      fetchFiles(user.id, currentFolder);
    } else alert("Error moving file: " + error.message);
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;
    const targetPath = currentFolder
      ? `shared/${currentFolder}/${folderName.trim()}/.keep`
      : `shared/${folderName.trim()}/.keep`;
    await supabase.storage
      .from("client-vault")
      .upload(targetPath, new Blob([""]));
    fetchFiles(user.id, currentFolder);
    fetchAllFolders();
  };

  const handleDeleteFolder = async (folderName: string) => {
    const folderPath = currentFolder
      ? `shared/${currentFolder}/${folderName}`
      : `shared/${folderName}`;
      
    const deleteRecursive = async (path: string) => {
      const { data } = await supabase.storage.from("client-vault").list(path);
      if (!data) return;
      for (const item of data) {
        if (item.id) {
          await supabase.storage.from("client-vault").remove([`${path}/${item.name}`]);
        } else {
          await deleteRecursive(`${path}/${item.name}`);
        }
      }
      await supabase.storage.from("client-vault").remove([`${path}/.keep`]);
    };

    await deleteRecursive(folderPath);
    fetchFiles(user.id, currentFolder);
    fetchAllFolders();
  };

  return {
    vaultItems,
    fileUrls,
    uploading,
    uploadProgress,
    allFolders,
    fetchFiles,
    handleUpload,
    getSignedUrl,
    handleDeleteFile,
    handleRenameFile,
    handleMoveFile,
    handleCreateFolder,
    handleDeleteFolder,
  };
};
