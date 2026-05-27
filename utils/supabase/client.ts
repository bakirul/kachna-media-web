"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // কনফার্ম করুন যে আপনার .env.local ফাইলে এই দুটি ভেরিয়েবল ঠিকঠাক আছে
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing in environment variables!",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
