import React, { useEffect, useState } from 'react';
import { Volume2, Mic, Activity, Radio } from 'lucide-react';

interface DualAudioWaveformProps {
  activeSpeaker: 'agent' | 'patient' | 'idle';
  isConnected: boolean;
}

export const DualAudioWaveform: React.FC<DualAudioWaveformProps> = ({
  activeSpeaker,
  isConnected
}) => {
  const [frequencies, setFrequencies] = useState<number[]>([
    14, 28, 45, 68, 85, 95, 72, 48, 30, 18, 22, 54, 76, 92, 64, 38, 20, 15, 32, 58, 80, 62, 35, 16
  ]);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setFrequencies(() => {
        return Array.from({ length: 24 }, () => {
          if (activeSpeaker === 'idle') return Math.floor(Math.random() * 12) + 6;
          return Math.floor(Math.random() * 75) + 25;
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, activeSpeaker]);

  return (
    <div className="bg-slate-950 text-white rounded-2xl p-4 border border-slate-800/90 shadow-lg space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
            activeSpeaker === 'agent'
              ? 'bg-sky-950/80 border-sky-500/80 text-sky-300 ring-1 ring-sky-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              activeSpeaker === 'agent' ? 'bg-sky-400 animate-ping' : 'bg-slate-600'
            }`} />
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-[11px]">
              Call-E Agent Voice
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
            activeSpeaker === 'patient'
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              activeSpeaker === 'patient' ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
            }`} />
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-[11px]">
              Patient Audio (PSTN)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 tabular-nums">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="font-medium">
            {activeSpeaker === 'agent' ? 'Synthesizing (Call-E HD)' : activeSpeaker === 'patient' ? 'Transcribing (Whisper/Gemini)' : 'Voice Activity Detector Standby'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-14 bg-slate-900/90 rounded-xl px-3 sm:px-4 py-2 border border-slate-800/80">
        {frequencies.map((height, i) => {
          const isAgentChannel = i < 12;
          const isActive = isAgentChannel ? activeSpeaker === 'agent' : activeSpeaker === 'patient';
          const baseColor = isAgentChannel 
            ? (isActive ? 'bg-gradient-to-t from-sky-600 to-sky-300 shadow-sm shadow-sky-500/40' : 'bg-sky-950/40')
            : (isActive ? 'bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-sm shadow-emerald-500/40' : 'bg-emerald-950/40');

          return (
            <div
              key={i}
              className={`w-1 sm:w-1.5 rounded-full transition-all duration-100 ${baseColor}`}
              style={{
                height: `${isActive ? height : Math.max(10, height * 0.22)}%`,
                minHeight: '6px'
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 tabular-nums">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Codec: Opus HD (48kHz 2-way)
        </span>
        <span>Jitter: 8ms • Latency: 220ms</span>
        <span className="text-slate-300 font-semibold">Loss: 0.0%</span>
      </div>
    </div>
  );
};
