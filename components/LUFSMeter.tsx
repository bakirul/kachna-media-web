// components/LUFSMeter.tsx
import React from "react";

interface LUFSMeterProps {
  lufs: number;
}

export default function LUFSMeter({ lufs }: LUFSMeterProps) {
  // Scale -60dB to 0dB into a 0-100% height
  const boundedLufs = Math.max(-60, Math.min(0, lufs));
  const heightPercentage = ((boundedLufs + 60) / 60) * 100;

  // Color Coding based on Broadcast Standards
  let barColor = "bg-green-500";
  if (boundedLufs > -14 && boundedLufs <= -9) barColor = "bg-yellow-400";
  else if (boundedLufs > -9) barColor = "bg-red-500";

  return (
    <div
      className="flex flex-col items-center gap-1"
      title={`Momentary LUFS: ${boundedLufs.toFixed(1)} dBFS`}
    >
      <div className="text-[9px] text-gray-500 font-mono">0</div>
      <div className="w-3 h-32 bg-[#121217] rounded-full border border-white/10 overflow-hidden relative flex flex-col-reverse shadow-inner">
        {/* The Dynamic Bar */}
        <div
          className={`w-full transition-all duration-75 ease-linear ${barColor}`}
          style={{ height: `${heightPercentage}%` }}
        />

        {/* Reference Markers */}
        <div
          className="absolute top-[23%] left-0 w-full border-b border-white/20"
          title="-14 dBFS Target"
        />
        <div
          className="absolute top-[50%] left-0 w-full border-b border-white/20"
          title="-30 dBFS"
        />
      </div>
      <div className="text-[9px] text-gray-500 font-mono">-60</div>
      <div className="mt-1 text-[10px] text-[#d4af37] font-bold w-12 text-center">
        {boundedLufs === -60 ? "-∞" : boundedLufs.toFixed(1)}
      </div>
    </div>
  );
}
