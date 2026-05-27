import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing!");
  }

  // এটি কুকির ঝামেলায় না গিয়ে সরাসরি ব্রাউজারের Local Storage এ সেশন সেভ করবে!
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
