// hooks/useLUFSMeter.ts
import { useEffect, useRef, useState, RefObject } from "react";

export const useLUFSMeter = (
  videoRef: RefObject<HTMLVideoElement>,
  fileUrl?: string,
) => {
  const [lufs, setLufs] = useState<number>(-60); // Default silence
  const audioCtxRef = useRef<AudioContext | null>(null);
  const initialized = useRef<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    // যদি ভিডিও না থাকে, তাহলে এখান থেকেই ফিরে যাবে
    if (!video) return;

    let sourceNode: MediaElementAudioSourceNode;
    let workletNode: AudioWorkletNode;

    const initAudio = async () => {
      // যদি আগে থেকেই কানেক্টেড থাকে, তবে ডাবল কানেক্ট করবে না
      if (initialized.current) return;

      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
        }
        const ctx = audioCtxRef.current;

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        // Public ফোল্ডার থেকে প্রসেসর লোড
        await ctx.audioWorklet.addModule("/worklets/lufs-processor.js");

        sourceNode = ctx.createMediaElementSource(video);
        workletNode = new AudioWorkletNode(ctx, "lufs-processor");

        workletNode.port.onmessage = (event) => {
          setLufs(event.data.lufs);
        };

        sourceNode.connect(workletNode);
        workletNode.connect(ctx.destination);

        initialized.current = true;
      } catch (error) {
        console.error("[WebAudio] API initialization failed:", error);
      }
    };

    // ভিডিও প্লে বাটনে ক্লিক করলেই অডিও ইঞ্জিন চালু হবে
    video.addEventListener("play", initAudio);

    return () => {
      video.removeEventListener("play", initAudio);
      if (workletNode) workletNode.disconnect();
      if (sourceNode) sourceNode.disconnect();
      initialized.current = false;
      setLufs(-60); // নতুন ভিডিও আসলে মিটার রিসেট করে দিবে
    };
    // 🔥 সবচেয়ে গুরুত্বপূর্ণ লাইন: videoRef.current এবং fileUrl চেঞ্জ হলে হুক রিস্টার্ট হবে
  }, [videoRef.current, fileUrl]);

  return { lufs };
};
