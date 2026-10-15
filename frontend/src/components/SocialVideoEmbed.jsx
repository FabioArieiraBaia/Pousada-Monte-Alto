import React from 'react';
import { Play, Sparkles, Video, ExternalLink } from 'lucide-react';
import { InstagramIcon, FacebookIcon, XIcon, YouTubeIcon } from './SocialIcons';

export default function SocialVideoEmbed({ url, title = "Vídeo em Destaque", isPreview = false }) {
  const cleanUrl = (url || '').trim();

  if (!cleanUrl) {
    if (isPreview) {
      return (
        <div className="w-full aspect-video max-w-xl mx-auto bg-stone-100 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-6 text-stone-400 text-center">
          <Video className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
          <p className="text-xs font-semibold">Nenhum link de vídeo inserido ainda.</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Insira um link do <strong>YouTube</strong>, <strong>Instagram</strong>, <strong>Facebook</strong> ou <strong>X (Twitter)</strong> acima para visualizar.
          </p>
        </div>
      );
    }
    return null;
  }

  // =========================================================================
  // 1. INSTAGRAM (Reels, Posts, IGTV)
  // =========================================================================
  if (cleanUrl.includes('instagram.com')) {
    const igMatch = cleanUrl.match(/instagram\.com\/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i);
    const igCode = igMatch ? igMatch[1] : null;

    if (!igCode) {
      if (isPreview) {
        return (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
            Link do Instagram não reconhecido. Use o link de um Reel ou Post (ex: <code>https://www.instagram.com/reel/C.../</code> ou <code>https://www.instagram.com/p/C.../</code>).
          </div>
        );
      }
      return null;
    }

    return (
      <div className="w-full max-w-md mx-auto bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 my-4">
        <div className="bg-stone-950/95 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <InstagramIcon className="w-3.5 h-3.5" />
            </div>
            <span>Instagram Reel / Post</span>
          </div>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
          >
            <span>Ver no Instagram</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="relative w-full bg-stone-950 flex justify-center py-2 min-h-[500px]">
          <iframe
            src={`https://www.instagram.com/p/${igCode}/embed/captioned/`}
            className="w-full border-0 rounded-2xl overflow-hidden"
            style={{ minHeight: '520px', maxWidth: '440px' }}
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

  // =========================================================================
  // 2. FACEBOOK (Reels, Videos, Watch, Posts)
  // =========================================================================
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch')) {
    const isFbReel = cleanUrl.includes('/reel/') || cleanUrl.includes('/share/r/');
    // Facebook Official Video Plugin Iframe
    const fbEmbedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&width=auto`;

    return (
      <div className={`w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 my-4 ${isFbReel ? 'max-w-md mx-auto' : 'max-w-3xl mx-auto'}`}>
        <div className="bg-stone-950/95 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <div className="w-6 h-6 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-sm">
              <FacebookIcon className="w-3.5 h-3.5" />
            </div>
            <span>{isFbReel ? 'Facebook Reel' : 'Facebook Vídeo'}</span>
          </div>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
          >
            <span>Ver no Facebook</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className={`relative w-full bg-stone-950 flex justify-center items-center ${isFbReel ? 'min-h-[520px]' : 'aspect-video'}`}>
          <iframe
            src={fbEmbedSrc}
            className="w-full h-full border-0 rounded-b-3xl"
            style={{ minHeight: isFbReel ? '520px' : '360px' }}
            title={title}
            frameBorder="0"
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. X / TWITTER (Tweets com vídeo / post)
  // =========================================================================
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    const xMatch = cleanUrl.match(/status\/([0-9]+)/i);
    const tweetId = xMatch ? xMatch[1] : null;

    if (!tweetId) {
      if (isPreview) {
        return (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
            Link do X (Twitter) não reconhecido. Certifique-se de copiar o link do post com o vídeo (ex: <code>https://x.com/usuario/status/123456789...</code>).
          </div>
        );
      }
      return null;
    }

    return (
      <div className="w-full max-w-lg mx-auto bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 my-4">
        <div className="bg-stone-950/95 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <div className="w-6 h-6 rounded-lg bg-black border border-stone-700 flex items-center justify-center text-white shadow-sm">
              <XIcon className="w-3.5 h-3.5" />
            </div>
            <span>X (Twitter) Vídeo</span>
          </div>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-stone-300 hover:text-white bg-stone-800 border border-stone-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
          >
            <span>Ver no X</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="relative w-full bg-white flex justify-center py-2 px-3 min-h-[420px]">
          <iframe
            src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&dnt=true`}
            className="w-full border-0 rounded-2xl overflow-hidden"
            style={{ minHeight: '440px', maxWidth: '480px' }}
            title={title}
            frameBorder="0"
            scrolling="no"
          ></iframe>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. YOUTUBE (Padrão, Shorts, youtu.be, embed, live)
  // =========================================================================
  let ytId = '';
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    ytId = ytMatch[1];
  }

  if (ytId) {
    const isShort = cleanUrl.toLowerCase().includes('/shorts/');

    return (
      <div className={`w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 my-4 ${isShort ? 'max-w-sm mx-auto' : 'max-w-4xl mx-auto'}`}>
        <div className="bg-stone-950/95 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
              <YouTubeIcon className="w-3.5 h-3.5" />
            </div>
            <span className="truncate max-w-[200px] sm:max-w-md">{title}</span>
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

  // =========================================================================
  // 5. VÍDEO DIRETO (MP4 / WEBM / MOV)
  // =========================================================================
  if (cleanUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i)) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 my-4">
        <div className="bg-stone-950/95 px-4 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
            <Video className="w-4 h-4 text-amber-500" />
            <span>{title}</span>
          </div>
          <span className="text-[10px] text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full">
            Vídeo MP4
          </span>
        </div>
        <video controls className="w-full rounded-b-3xl max-h-[500px]" src={cleanUrl}>
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>
    );
  }

  // =========================================================================
  // 6. FALLBACK PARA LINKS NÃO IDENTIFICADOS DIRETAMENTE
  // =========================================================================
  if (isPreview) {
    return (
      <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs space-y-1">
        <p className="font-bold">⚠️ Formato de link de vídeo não reconhecido.</p>
        <p>Formatos suportados:</p>
        <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5 mt-1">
          <li><strong>YouTube:</strong> Vídeos normais ou Shorts (ex: <code>https://youtube.com/watch?v=...</code> ou <code>https://youtube.com/shorts/...</code>)</li>
          <li><strong>Instagram:</strong> Reels ou Posts (ex: <code>https://instagram.com/reel/...</code>)</li>
          <li><strong>Facebook:</strong> Reels, Watch ou Vídeos (ex: <code>https://facebook.com/watch/?v=...</code> ou <code>https://fb.watch/...</code>)</li>
          <li><strong>X (Twitter):</strong> Posts com vídeo (ex: <code>https://x.com/usuario/status/...</code>)</li>
        </ul>
      </div>
    );
  }

  // Fallback no site público: exibe um card com botão elegante para abrir o link
  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-stone-900 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 text-white my-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <Play className="w-4 h-4 fill-amber-400" />
        </div>
        <div>
          <span className="font-bold text-xs block">{title}</span>
          <span className="text-[11px] text-stone-400 truncate max-w-xs block">{cleanUrl}</span>
        </div>
      </div>
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
      >
        <span>Assistir Vídeo</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
