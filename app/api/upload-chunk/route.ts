// app/api/upload-chunk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { VideoTranscoder } from "@/utils/videoTranscoder"; // Import at the top

// Zod Schema for strict formData validation (coercing strings to numbers)
const ChunkSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  chunkIndex: z.coerce.number().min(0, "chunkIndex must be >= 0"),
  totalChunks: z.coerce.number().min(1, "totalChunks must be >= 1"),
});

// Configure upload directory (fallback to OS temp if not in standard env)
const UPLOAD_DIR = path.join(os.tmpdir(), "kachna-media-uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const fileId = formData.get("fileId");
    const chunkIndex = formData.get("chunkIndex");
    const totalChunks = formData.get("totalChunks");
    const chunkFile = formData.get("chunk") as File | null;

    if (!chunkFile) {
      return NextResponse.json({ error: "Missing chunk data" }, { status: 400 });
    }

    // Validate using Zod
    const parsed = ChunkSchema.safeParse({ fileId, chunkIndex, totalChunks });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { fileId: validFileId, chunkIndex: validIndex, totalChunks: validTotal } = parsed.data;

    // Ensure base upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Create a dedicated temp folder for this specific file session
    const fileSessionDir = path.join(UPLOAD_DIR, validFileId);
    await fs.mkdir(fileSessionDir, { recursive: true });

    // Read chunk buffer and save to temporary part file
    const arrayBuffer = await chunkFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const chunkPath = path.join(fileSessionDir, `chunk_${validIndex}`);
    
    await fs.writeFile(chunkPath, buffer);

    // Concurrency Check: Determine if this is the final chunk that completes the set
    // We check the directory size instead of relying on chunkIndex === totalChunks - 1 
    // to prevent race conditions during concurrent uploads.
    const uploadedFiles = await fs.readdir(fileSessionDir);
    
    if (uploadedFiles.length === validTotal) {
      await reassembleFile(fileSessionDir, validFileId, validTotal);
    }

    return NextResponse.json({ success: true, message: `Chunk ${validIndex} processed.` });

  } catch (error: any) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Reassembles out-of-order chunks into a single final video file.
 */
async function reassembleFile(sessionDir: string, fileId: string, totalChunks: number) {
    try {
      const finalFilePath = path.join(UPLOAD_DIR, `${fileId}_final.mp4`); 
      
      // Open a writable stream for the final file
      const finalFileHandle = await fs.open(finalFilePath, 'a');
  
      // Append each chunk sequentially to guarantee file integrity
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await finalFileHandle.appendFile(chunkData);
        
        // Cleanup chunk after appending
        await fs.unlink(chunkPath);
      }
  
      await finalFileHandle.close();
      
      // Cleanup empty session directory
      await fs.rmdir(sessionDir);
  
      console.log(`[File Pipeline] Successfully reassembled: ${finalFilePath}`);
      
      // টাস্ক ১.২: এখানেই TODO-এর বদলে নতুন ট্রান্সকোডিং কোডটি বসেছে
      VideoTranscoder.generateHLS({
        inputPath: finalFilePath,
        fileId: fileId,
        onProgress: (percent) => {
          console.log(`[Transcoding] ${fileId}: ${percent}% complete`);
        }
      }).catch(err => {
        console.error(`[Background Task] HLS generation failed for ${fileId}:`, err);
      });
      
    } catch (error) {
      console.error(`[File Pipeline Error] Failed to reassemble ${fileId}:`, error);
      throw error;
    }
  }