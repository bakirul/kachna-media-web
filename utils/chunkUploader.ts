// utils/chunkUploader.ts

export interface UploadProgressCallback {
    (progress: number): void;
  }
  
  interface UploadConfig {
    file: File;
    fileId: string;
    chunkSize?: number; // Default: 5MB
    maxConcurrency?: number; // Default: 3
    maxRetries?: number; // Default: 3
    onProgress: UploadProgressCallback;
  }
  
  export class ChunkUploader {
    private file: File;
    private fileId: string;
    private chunkSize: number;
    private maxConcurrency: number;
    private maxRetries: number;
    private onProgress: UploadProgressCallback;
    private totalChunks: number;
    private uploadedChunks: number = 0;
  
    constructor(config: UploadConfig) {
      this.file = config.file;
      this.fileId = config.fileId;
      this.chunkSize = config.chunkSize || 5 * 1024 * 1024; // 5MB exact
      this.maxConcurrency = config.maxConcurrency || 3;
      this.maxRetries = config.maxRetries || 3;
      this.onProgress = config.onProgress;
      this.totalChunks = Math.ceil(this.file.size / this.chunkSize);
    }
  
    /**
     * Orchestrates the chunking and concurrent upload process.
     */
    public async startUpload(): Promise<void> {
      if (this.totalChunks === 0) throw new Error("File is empty.");
  
      const uploadTasks: (() => Promise<void>)[] = [];
  
      for (let index = 0; index < this.totalChunks; index++) {
        const start = index * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);
  
        uploadTasks.push(() => this.uploadChunkWithRetry(chunk, index));
      }
  
      await this.processConcurrently(uploadTasks, this.maxConcurrency);
    }
  
    /**
     * Executes tasks concurrently up to the specified limit.
     */
    private async processConcurrently(tasks: (() => Promise<void>)[], limit: number) {
      const executing = new Set<Promise<void>>();
      for (const task of tasks) {
        const p = task().finally(() => executing.delete(p));
        executing.add(p);
        if (executing.size >= limit) {
          await Promise.race(executing);
        }
      }
      await Promise.all(executing);
    }
  
    /**
     * Uploads a single chunk with retry logic.
     */
    private async uploadChunkWithRetry(chunk: Blob, index: number, attempt: number = 1): Promise<void> {
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("fileId", this.fileId);
      formData.append("chunkIndex", index.toString());
      formData.append("totalChunks", this.totalChunks.toString());
  
      try {
        const response = await fetch("/api/upload-chunk", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`Server returned ${response.status} for chunk ${index}`);
        }
  
        this.uploadedChunks++;
        const progress = Math.round((this.uploadedChunks / this.totalChunks) * 100);
        this.onProgress(progress);
  
      } catch (error) {
        if (attempt < this.maxRetries) {
          console.warn(`Chunk ${index} failed. Retrying (${attempt}/${this.maxRetries})...`);
          await new Promise((res) => setTimeout(res, 1000 * attempt)); // Exponential backoff
          return this.uploadChunkWithRetry(chunk, index, attempt + 1);
        }
        throw new Error(`Failed to upload chunk ${index} after ${this.maxRetries} attempts.`);
      }
    }
  }