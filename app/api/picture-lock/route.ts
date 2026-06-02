// app/api/picture-lock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// বিল্ড-টাইম ক্র্যাশ এড়াতে এবং রানটাইমে সিকিউর অ্যাডমিন ক্লায়েন্ট পাওয়ার জন্য একটি হেল্পার ফাংশন
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // বিল্ড ফেস পার করার জন্য একটি নিরাপদ ডামি ক্লায়েন্ট রিটার্ন করবে
    console.warn(
      "⚠️ Service role credentials empty during compilation. Utilizing build-safe placeholder client.",
    );
    return createClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseServiceKey || "placeholder-token-for-build-pass",
    );
  }

  // রিয়েল রানটাইমে (লাইভ সাইটে) আসল সুরক্ষিত ক্লায়েন্ট রিটার্ন করবে
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, userId, duration, frameRate } = await req.json();

    if (!fileName || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ফাংশন এক্সিকিউশনের সময় অ্যাডমিন ক্লায়েন্ট কল করা হলো (Complete Build Safety)
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Generate a temporary signed URL to stream the file from Supabase Storage
    const { data: signedUrlData, error: signError } =
      await supabaseAdmin.storage
        .from("client-vault")
        .createSignedUrl(fileName, 60); // Valid for 60 seconds

    if (signError || !signedUrlData) {
      throw new Error("Could not access file for hashing");
    }

    // 2. Fetch the file stream
    const response = await fetch(signedUrlData.signedUrl);
    if (!response.body) throw new Error("Failed to stream file");

    // 3. Initialize Cryptographic Hash (SHA-256)
    const hash = crypto.createHash("sha256");

    // Add unique metadata to the hash digest first (Salting with metadata)
    hash.update(`filename:${fileName}|duration:${duration}|fps:${frameRate}`);

    // 4. Stream the binary data into the hash function (Memory Efficient)
    const reader = response.body.getReader();
    let done = false;

    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (value) {
        hash.update(value); // Feed chunks to the hash algorithm
      }
      done = isDone;
    }

    const finalHash = hash.digest("hex");

    // 5. Save the Lock State and Integrity Hash to Database
    const { data, error: dbError } = await supabaseAdmin
      .from("video_metadata")
      .upsert(
        {
          file_name: fileName,
          is_locked: true,
          integrity_hash: finalHash,
          locked_by: userId,
          locked_at: new Date().toISOString(),
          metadata: { duration, frameRate },
        },
        { onConflict: "file_name" },
      )
      .select();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      message: "Picture Lock Applied Successfully",
      hash: finalHash,
    });
  } catch (error: any) {
    console.error("[Picture Lock Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
