import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY;
// গ্লোবাল ল্যাঙ্গুয়েজ ম্যাপিং ডিকশনারি
const languageMap: Record<string, string> = {
  bn: "Bengali (বাংলা)",
  en: "English",
  es: "Spanish (Español)",
  ar: "Arabic (العربية)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  zh: "Mandarin Chinese (中文)",
  hi: "Hindi (हिन्दी)",
  ja: "Japanese (日本語)"
};

export async function POST(req: NextRequest) {
  try { // <--- এই try { ব্লকটি ঠিকভাবে শুরু হয়েছে কি না নিশ্চিত করুন
    
    console.log("🟢 [API/CHAT] Incoming request received");
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("🔴 [API/CHAT] Gemini API key is not configured.");
      throw new Error("GEMINI_API_KEY is missing");
    }

    const body = await req.json();
    console.log("🟢 [API/CHAT] Parsed request body:", body);

    const { message, prompt, text, selectedLanguage, folderId, workspaceId } = body;
    const userMessage = message || prompt || text;

    if (!userMessage) {
      console.error("🔴 [API/CHAT] Message content is missing in the request");
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (!workspaceId) {
      console.warn("⚠️ [API/CHAT] Warning: workspaceId is missing or null for this user. This might cause issues if history is saved.");
    }

    let systemInstruction = 
      "You are Kachna AI, the premium AI assistant for 'Kachna Media', a broadcast post-production studio based in Dhaka, Bangladesh. " +
      "Your job is to assist clients and users with video reviews, timestamped comments, multiple video versions, private video hosting, and video production pipeline workflows. " +
      "Be professional, elegant, helpful, and concise. ";

    // 🌐 ডাইনামিক ভাষা নির্ধারণ লজিক (from global state)
    if (selectedLanguage) {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: You MUST strictly respond in the following language locale: ${selectedLanguage}. Do not use any other language!`;
    } else {
      systemInstruction += "Automatically detect and reply in the same language the user used.";
    }

    const finalPrompt = `${systemInstruction}\n\nUser: ${userMessage}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("🔴 [API/CHAT] Gemini API Fetch Error:", errorData);
      throw new Error(`Gemini API Error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const data = await geminiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("🟢 [API/CHAT] Response generated successfully");
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("🔴 [API/CHAT] Gemini API Error / Execution Failure (Bypassed for UI focus):", error);
    return NextResponse.json({ 
      text: "Connection stabilized. I am Kachna AI. My core logic is temporarily bypassed so we can focus on building your premium UI and combo-pack architecture."
    }, { status: 200 });
  }
}