import React from 'react';
import { Play, Sparkles, Video } from 'lucide-react';
import { InstagramIcon } from './SocialIcons';

export default function SocialVideoEmbed({ url, title = "Vídeo em Destaque", isPreview = false }) {
  const cleanUrl = (url || '').trim();

  if (!cleanUrl) {
    if (isPreview) {
      return (
        <div className="w-full aspect-video max-w-xl mx-auto bg-stone-100 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-6 text-stone-400 text-center">
          <Video className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
          <p className="text-xs font-semibold">Nenhum link de vídeo inserido ainda.</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Insira um link do YouTube ou Instagram acima para visualizar.</p>
        </div>
      );
    }
    return null;
  }

  // 1. Detect Instagram (Reels, Posts, TV)
  const isInstagram = cleanUrl.includes('instagram.com');
  if (isInstagram) {
    // Extract shortcode: instagram.com/reel/CODE, /reels/CODE, /p/CODE, /tv/CODE
    const igMatch = cleanUrl.match(/instagram\.com\/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i);
    const igCode = igMatch ? igMatch[1] : null;

    if (!igCode) {
      if (isPreview) {
        return (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
            Link do Instagram não reconhecido. Certifique-se de usar o link completo do post ou reel (ex: https://www.instagram.com/reel/C.../ ou https://www.instagram.com/p/C.../).
          </div>
        );
      }
      return null;
    }

    return (
      <div className="w-full max-w-md mx-auto bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
        <div className="bg-stone-950/90 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <InstagramIcon className="w-3.5 h-3.5" />
            </div>
            <span>Instagram Reel / Post</span>
          </div>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Vídeo Social
          </span>
        </div>

        <div className="relative w-full bg-stone-950 flex justify-center py-2">
          <iframe
            src={`https://www.instagram.com/p/${igCode}/embed/captioned/`}
            className="w-full border-0 rounded-2xl overflow-hidden"
            style={{ minHeight: '520px', maxWidth: '400px' }}
            title={title}
            frameBorder="0"
            scrolling="no"
            allowTransparency="true"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      </div>
    );
  }

  // 2. Detect YouTube (Regular, Shorts, youtu.be, embed)
  let ytId = '';
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    ytId = ytMatch[1];
  }

  if (!ytId) {
    if (isPreview) {
      return (
        <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          Link do YouTube não reconhecido. Certifique-se de usar o link com ID de vídeo (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...).
        </div>
      );
    }
    return null;
  }

  const isShort = cleanUrl.toLowerCase().includes('/shorts/');

  return (
    <div className={`w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 ${isShort ? 'max-w-sm mx-auto' : 'max-w-4xl mx-auto'}`}>
      <div className="bg-stone-950/90 px-4 py-3 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
          <span>{title}</span>
        </div>
        {isShort ? (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Shorts Vertical
          </span>
        ) : (
          <span className="text-[10px] text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full font-medium">
            YouTube HD 1080p
          </span>
        )}
      </div>

      <div className={`relative overflow-hidden w-full ${isShort ? 'pb-[177.77%] h-0' : 'pb-[56.25%] h-0'}`}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
