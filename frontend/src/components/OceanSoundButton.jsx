import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Waves } from 'lucide-react';

export default function OceanSoundButton({ className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const nodesRef = useRef([]);

  const toggleSound = () => {
    if (isPlaying) {
      stopOceanSound();
      setIsPlaying(false);
    } else {
      startOceanSound();
      setIsPlaying(true);
    }
  };

  const startOceanSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Create pink noise buffer (3 seconds looping)
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass Filter for soft underwater / sea tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 1.2;

      // Modulate filter frequency with slow LFO for wave swells (0.12 Hz ~ 8 second ocean waves)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 280;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Master Gain for smooth fade in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 1.5);
      gainNodeRef.current = masterGain;

      // Connect graph: noise -> filter -> masterGain -> destination
      noise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      noise.start();
      lfo.start();

      nodesRef.current = [noise, lfo, lfoGain, filter, masterGain];
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  };

  const stopOceanSound = () => {
    if (audioCtxRef.current && gainNodeRef.current) {
      try {
        const ctx = audioCtxRef.current;
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => {
          ctx.close();
          nodesRef.current = [];
        }, 600);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    return () => {
      stopOceanSound();
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-300 shadow-sm border ${
        isPlaying
          ? 'bg-amber-500/25 border-amber-400/60 text-amber-300 scale-105'
          : 'bg-stone-900/60 hover:bg-stone-900/80 border-white/20 text-stone-300 hover:text-white'
      } ${className}`}
      title={isPlaying ? 'Pausar som das ondas' : 'Ouvir o som das ondas de Monte Alto'}
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-semibold text-[11px]">Ouvindo as ondas...</span>
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 h-full bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
            <span className="w-0.5 h-full bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
            <span className="w-0.5 h-full bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_200ms]" />
          </div>
        </>
      ) : (
        <>
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Ouvir as ondas do mar</span>
        </>
      )}
    </button>
  );
}
