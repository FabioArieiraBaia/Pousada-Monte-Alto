import React from 'react';
import { Play, Sparkles } from 'lucide-react';

export default function YouTubeEmbed({ url, title = "Tour Virtual em Vídeo" }) {
  if (!url) return null;

  // Extract YouTube ID from various formats including Shorts (youtube.com/shorts/...), youtu.be, embed and standard watch
  let videoId = '';
  const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (match && match[1]) {
    videoId = match[1];
  }

  if (!videoId) {
    return null;
  }

  const isShort = url.toLowerCase().includes('/shorts/');

  return (
    <div className={`w-full bg-stone-900 rounded-2xl overflow-hidden shadow-xl border border-stone-800 ${isShort ? 'max-w-sm mx-auto' : ''}`}>
      <div className="bg-stone-950/80 px-4 py-2.5 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold uppercase tracking-wider">
          <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>{title}</span>
        </div>
        {isShort ? (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Shorts Vertical
          </span>
        ) : (
          <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">HD 1080p</span>
        )}
      </div>
      <div className={`relative overflow-hidden ${isShort ? 'pb-[177.77%] h-0' : 'pb-[56.25%] h-0'}`}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
