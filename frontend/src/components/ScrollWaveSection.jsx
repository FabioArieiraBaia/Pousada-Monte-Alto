import React, { useEffect, useRef, useState } from 'react';
import { Waves, Sparkles, Compass, ArrowDown } from 'lucide-react';

export default function ScrollWaveSection() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress from 0 (entering viewport) to 1 (leaving viewport)
      const totalDist = rect.height + windowHeight;
      const currentPos = windowHeight - rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentPos / totalDist));
      setScrollProgress(rawProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth Canvas Wave & Foam Simulation driven by scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let targetProgress = scrollProgress;
    let currentProgress = scrollProgress;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const render = () => {
      time += 0.02;
      // Smooth lerp interpolation for silky scroll response
      currentProgress += (targetProgress - currentProgress) * 0.08;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. Sand Base Background (Warm wet shoreline sand)
      const sandGrad = ctx.createLinearGradient(0, 0, 0, h);
      sandGrad.addColorStop(0, '#f5ebe0');
      sandGrad.addColorStop(0.5, '#e6ccb2');
      sandGrad.addColorStop(1, '#ddb892');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 0, w, h);

      // Wet Sand Sheen (where previous waves washed)
      const wetSandHeight = h * (0.3 + currentProgress * 0.55);
      const wetGrad = ctx.createLinearGradient(0, 0, 0, wetSandHeight);
      wetGrad.addColorStop(0, 'rgba(180, 145, 115, 0.45)');
      wetGrad.addColorStop(0.8, 'rgba(195, 155, 120, 0.25)');
      wetGrad.addColorStop(1, 'rgba(245, 235, 224, 0)');
      ctx.fillStyle = wetGrad;
      ctx.fillRect(0, 0, w, wetSandHeight);

      // 2. Wave Level based directly on scroll progress (0 = deep ocean, 1 = wave fully ashore)
      // When scrolling down -> wave reaches further down; when scrolling up -> wave recedes!
      const waveBaseY = h * (0.15 + currentProgress * 0.68);

      // Wave Layer 3: Deep Turquoise Ocean Water (Back)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, waveBaseY - 25);
      for (let x = 0; x <= w; x += 15) {
        const waveSin = Math.sin(x * 0.008 + time * 1.5) * 16 + Math.sin(x * 0.015 - time) * 8;
        ctx.lineTo(x, waveBaseY - 25 + waveSin);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      const oceanDeep = ctx.createLinearGradient(0, 0, 0, waveBaseY);
      oceanDeep.addColorStop(0, '#0284c7');
      oceanDeep.addColorStop(0.6, '#0ea5e9');
      oceanDeep.addColorStop(1, '#06b6d4');
      ctx.fillStyle = oceanDeep;
      ctx.fill();

      // Wave Layer 2: Crystal Turquoise Swell (Middle)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, waveBaseY - 8);
      for (let x = 0; x <= w; x += 12) {
        const waveSin = Math.sin(x * 0.01 + time * 2) * 20 + Math.sin(x * 0.02 - time * 1.2) * 10;
        ctx.lineTo(x, waveBaseY - 8 + waveSin);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      const oceanMid = ctx.createLinearGradient(0, 0, 0, waveBaseY);
      oceanMid.addColorStop(0, 'rgba(14, 165, 233, 0.9)');
      oceanMid.addColorStop(0.7, 'rgba(45, 212, 191, 0.85)');
      oceanMid.addColorStop(1, 'rgba(94, 234, 212, 0.95)');
      ctx.fillStyle = oceanMid;
      ctx.fill();

      // Wave Layer 1: Leading Wave Crest with White Sea Foam (Front)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, waveBaseY);
      const foamPoints = [];
      for (let x = 0; x <= w; x += 8) {
        const waveSin = Math.sin(x * 0.012 + time * 2.2) * 18 + 
                        Math.sin(x * 0.025 + time * 3) * 8 +
                        Math.sin(x * 0.004 - time) * 12;
        const curY = waveBaseY + waveSin;
        foamPoints.push({ x, y: curY });
        ctx.lineTo(x, curY);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();

      const oceanFront = ctx.createLinearGradient(0, 0, 0, waveBaseY + 20);
      oceanFront.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
      oceanFront.addColorStop(0.8, 'rgba(45, 212, 191, 0.9)');
      oceanFront.addColorStop(1, 'rgba(204, 251, 241, 0.95)');
      ctx.fillStyle = oceanFront;
      ctx.fill();

      // White Breaking Wave Foam Outline
      ctx.beginPath();
      for (let i = 0; i < foamPoints.length; i++) {
        const pt = foamPoints[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 14 + Math.sin(time * 3) * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Delicate Secondary Sea Foam Bubbles
      ctx.beginPath();
      for (let i = 0; i < foamPoints.length; i += 2) {
        const pt = foamPoints[i];
        const bubbleY = pt.y + (Math.sin(i + time * 4) * 8);
        if (i === 0) ctx.moveTo(pt.x, bubbleY);
        else ctx.lineTo(pt.x, bubbleY);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 4;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Update targetProgress when scrollProgress updates
  useEffect(() => {
    // handled via state / animation
  }, [scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[480px] sm:min-h-[580px] w-full overflow-hidden my-12 flex items-center justify-center shadow-inner"
    >
      {/* Interactive Interactive Scroll-Driven Wave Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Floating Sensory Content Overlay */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
        
        {/* Dynamic Badge indicating wave reactive scroll */}
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-stone-900 border border-white/60 shadow-lg animate-bounce">
          <Waves className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span>Role para ver a onda avançar na areia</span>
          <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
        </div>

        <div className="space-y-3 bg-stone-950/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/20 text-white shadow-2xl">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest block">
            A Experiência Pé na Areia
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight drop-shadow-md">
            O ritmo sereno do mar na porta do seu quarto
          </h2>
          <p className="text-stone-200 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Em Monte Alto, as águas são calmas e límpidas. Deixe a rotina para trás e sinta a areia branca sob os pés a qualquer hora do dia.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-stone-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Águas Calmas & Cristalinas
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Praia Sem Aglomerações
            </span>
          </div>
        </div>

      </div>

      {/* Soft Gradient Fade to Next Section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-sand-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-sand-50 to-transparent pointer-events-none" />
    </div>
  );
}
