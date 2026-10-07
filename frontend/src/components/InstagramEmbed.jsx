import React from 'react';
import { InstagramIcon } from './SocialIcons';
import { ExternalLink } from 'lucide-react';

export default function InstagramEmbed({ url, title = "Reels / Vídeo no Instagram" }) {
  if (!url) return null;

  const match = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i);
  const postCode = match ? match[1] : null;

  if (!postCode) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-amber-900/20 border border-pink-500/30 hover:border-pink-500 transition-all shadow-lg group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors block">
                Ver no Instagram
              </span>
              <span className="text-[11px] text-stone-400">Reels & Vídeos do Passeio</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-pink-400 transition-colors" />
        </div>
      </a>
    );
  }

  const embedUrl = `https://www.instagram.com/p/${postCode}/embed/captioned/`;

  return (
    <div className="w-full max-w-md mx-auto bg-stone-900 rounded-2xl overflow-hidden shadow-xl border border-pink-500/20">
      <div className="bg-stone-950/90 px-4 py-2.5 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white">
            <InstagramIcon className="w-3 h-3" />
          </div>
          <span>Instagram Reels</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
        >
          <span>Abrir no app</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="relative w-full flex justify-center bg-stone-950 p-1 sm:p-2 min-h-[480px]">
        <iframe
          src={embedUrl}
          className="w-full border-0 rounded-xl shadow-inner min-h-[480px] max-h-[620px]"
          allowTransparency="true"
          frameBorder="0"
          scrolling="no"
          allow="encrypted-media"
          title={title}
        ></iframe>
      </div>
    </div>
  );
}
