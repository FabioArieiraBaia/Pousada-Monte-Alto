import React, { useEffect, useRef } from 'react';

export default function InteractiveVideoBackground({ mode = 'sea' }) {
  const seaVideoRef = useRef(null);
  const sunsetVideoRef = useRef(null);
  const scrollTimeout = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Play both videos in continuous 60fps hardware accelerated loop
    const playVideo = (vid) => {
      if (vid) {
        vid.muted = true;
        vid.defaultMuted = true;
        vid.playsInline = true;
        vid.playbackRate = 1.0;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const resume = () => {
              vid.play();
              window.removeEventListener('scroll', resume);
              window.removeEventListener('click', resume);
            };
            window.addEventListener('scroll', resume, { once: true });
            window.addEventListener('click', resume, { once: true });
          });
        }
      }
    };

    playVideo(seaVideoRef.current);
    playVideo(sunsetVideoRef.current);
  }, []);

  // High performance scroll velocity modulation without moving bounds offscreen
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY || window.pageYOffset;
          const deltaY = currentY - lastScrollY.current;
          lastScrollY.current = currentY;

          // Dynamically accelerate video speed during active scroll
          const activeVideo = mode === 'sea' ? seaVideoRef.current : sunsetVideoRef.current;
          if (activeVideo) {
            if (Math.abs(deltaY) > 4) {
              activeVideo.playbackRate = 1.75;
            }

            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
              if (activeVideo) {
                activeVideo.playbackRate = 1.0;
              }
            }, 120);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout.current);
    };
  }, [mode]);

  const seaVideoSrc = '/montealto/videos/ocean_waves.webm';
  const sunsetVideoSrc = '/montealto/videos/sunset_lagoon.webm';

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-stone-950">
      {/* 1. Sea Beach Waves Video (Fixed Full Screen, Seamless 100vw x 100vh) */}
      <video
        ref={seaVideoRef}
        src={seaVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          mode === 'sea' ? 'opacity-70' : 'opacity-0'
        }`}
      />

      {/* 2. Sunset Lagoon Video (Fixed Full Screen, Seamless 100vw x 100vh) */}
      <video
        ref={sunsetVideoRef}
        src={sunsetVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          mode === 'sunset' ? 'opacity-75' : 'opacity-0'
        }`}
      />

      {/* Uniform Atmospheric Gradient for Clean Text Readability */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        mode === 'sea'
          ? 'bg-gradient-to-b from-stone-950/70 via-stone-950/30 to-stone-950/75'
          : 'bg-gradient-to-b from-stone-950/70 via-amber-950/35 to-stone-950/75'
      }`} />
    </div>
  );
}
