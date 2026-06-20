import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const TRANSLATE_MODEL = "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!genAI || !apiKey) {
      console.error("🔴 [API/TRANSLATE] GEMINI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 },
      );
    }

    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and targetLanguage are required" },
        { status: 400 },
      );
    }

    const systemInstruction = `You are a strict, highly accurate translation engine. Translate the following text into ${targetLanguage}. ONLY output the translated text. Do NOT add any conversational filler, notes, or quotes.`;

    const model = genAI.getGenerativeModel({
      model: TRANSLATE_MODEL,
      systemInstruction,
    });

    const result = await model.generateContent(String(text));
    const responseText = result.response.text().trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty translation");
    }

    return NextResponse.json({ translatedText: responseText });
  } catch (error: unknown) {
    const failureReason =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    console.error("🔴 [API/TRANSLATE] Gemini request failed:", {
      model: TRANSLATE_MODEL,
      reason: failureReason,
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    return NextResponse.json(
      { error: `Translation failed: ${failureReason}` },
      { status: 500 },
    );
  }
}
