import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Clock, ArrowLeft, Video, Share2, Tag, 
  Check, Copy, MessageCircle, Send, ChevronLeft, ChevronRight,
  Maximize2, Image as ImageIcon, X
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getBlogPostBySlug(slug)
      .then(res => setPost(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  let galleryList = [];
  if (post?.gallery_photos) {
    if (Array.isArray(post.gallery_photos)) galleryList = post.gallery_photos;
    else if (typeof post.gallery_photos === 'string') {
      try { galleryList = JSON.parse(post.gallery_photos); } catch (e) { galleryList = []; }
    }
  }
  if (!Array.isArray(galleryList)) galleryList = [];

  const handlePrevPhoto = (e) => {
    if (e) e.stopPropagation();
    if (!galleryList.length) return;
    setLightboxIndex((lightboxIndex - 1 + galleryList.length) % galleryList.length);
  };

  const handleNextPhoto = (e) => {
    if (e) e.stopPropagation();
    if (!galleryList.length) return;
    setLightboxIndex((lightboxIndex + 1) % galleryList.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryList]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-stone-900">Artigo não encontrado</h2>
        <Link to="/blog" className="text-amber-600 font-bold inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar ao blog
        </Link>
      </div>
    );
  }

  const title = post[`title_${lang}`] || post.title_pt;
  const content = post[`content_${lang}`] || post.content_pt;
  const excerpt = post[`excerpt_${lang}`] || post.excerpt_pt;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "image": [post.featured_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": {
      "@type": "Organization",
      "name": "Pousada Monte Alto",
      "url": "https://fabioarieira.com/montealto"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pousada Monte Alto",
      "logo": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"
      }
    },
    "description": excerpt
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://fabioarieira.com/montealto/blog/${slug}`;
  const shareText = `${title} - Pousada Monte Alto`;

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentUrl);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`
  };

  return (
    <div className="pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Dynamic SEO Head with BlogPosting Schema */}
      <SEOHead
        title={title}
        description={excerpt}
        image={post.featured_image}
        type="article"
        schemaJson={blogSchema}
      />

      {/* Back to Blog Button & Quick Share */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('blog.backToBlog')}</span>
        </Link>

        {/* Quick Floating Share Buttons */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5" />
            {t('blog.sharePost')}:
          </span>
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all transform hover:scale-110 shadow-sm"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all transform hover:scale-110 shadow-sm"
            title="Compartilhar no Facebook"
          >
            <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">f</span>
          </a>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-stone-900 hover:bg-black text-white transition-all transform hover:scale-110 shadow-sm border border-white/20"
            title="Compartilhar no Twitter / X"
          >
            <span className="w-4 h-4 flex items-center justify-center font-black text-xs">𝕏</span>
          </a>
          <a
            href={shareLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white transition-all transform hover:scale-110 shadow-sm"
            title="Compartilhar no Telegram"
          >
            <Send className="w-4 h-4" />
          </a>
          <button
            onClick={handleCopyLink}
            className={`p-1.5 rounded-full transition-all transform hover:scale-110 shadow-sm ${
              copied
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={copied ? t('blog.linkCopied') : t('blog.copyLink')}
          >
            {copied ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Article Header (High-contrast glass card with crisp white title and black shadow) */}
      <div className="bg-black/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
          <span className="flex items-center gap-1 font-bold text-amber-400 drop-shadow-sm">
            <Calendar className="w-4 h-4" />
            {new Date(post.published_at).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-white/40">•</span>
          <span className="flex items-center gap-1 text-stone-300 drop-shadow-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            {t('blog.readTime')}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-72 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden shadow-2xl bg-stone-950 border border-white/20 group">
          <img
            src={post.featured_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            width="1200"
            height="800"
            decoding="async"
          />
        </div>
      )}

      {/* Embedded YouTube Video if present */}
      {post.youtube_video_url && (
        <div className="space-y-3 pt-2">
          <YouTubeEmbed url={post.youtube_video_url} title={`Vídeo do Artigo: ${title}`} />
        </div>
      )}

      {/* Article Content Container with White Text & Black Shadows */}
      <article className="bg-black/55 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-white/20 shadow-2xl space-y-8">
        <div
          className="blog-content text-white text-base sm:text-lg leading-relaxed space-y-4 font-normal"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* 📸 GALERIA DE FOTOS DA MATÉRIA (SE HOUVER FOTOS ADICIONAIS) 📸 */}
        {galleryList.length > 0 && (
          <div className="pt-6 border-t border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-white text-lg sm:text-xl flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Galeria de Fotos da Matéria</span>
              </span>
              <span className="text-xs bg-amber-500 text-stone-950 font-bold px-3 py-1 rounded-full shadow-md">
                📸 {galleryList.length} {galleryList.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
              {galleryList.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative h-40 sm:h-52 rounded-2xl overflow-hidden shadow-lg bg-stone-900 border border-white/20 cursor-pointer hover:border-amber-400 transition-all duration-300"
                >
                  <img
                    src={imgUrl}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📢 Share Section at bottom of article */}
        <div className="pt-6 border-t border-white/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-400" />
              <span className="font-serif font-bold text-white text-sm sm:text-base">
                {t('blog.sharePost', { defaultValue: 'Gostou deste artigo? Compartilhe com amigos:' })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md transform hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md transform hover:scale-105"
              >
                <span className="font-bold">f</span>
                <span>Facebook</span>
              </a>

              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 transition-all shadow-md transform hover:scale-105"
              >
                <span className="font-bold">𝕏</span>
                <span>Twitter</span>
              </a>

              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md transform hover:scale-105"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </a>

              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md transform hover:scale-105 ${
                  copied
                    ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('blog.linkCopied') : t('blog.copyLink')}</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Tag className="w-4 h-4 text-amber-400" />
              {post.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/15 backdrop-blur-md text-white font-bold px-3.5 py-1.5 rounded-full border border-white/25 shadow-sm"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Call to Action Card */}
      <div className="bg-stone-950/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-amber-400/40 text-center space-y-4 shadow-2xl">
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Gostou das dicas de Arraial do Cabo?
        </h3>
        <p className="text-stone-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed drop-shadow-sm">
          Hospede-se na Pousada Monte Alto e aproveite cada uma dessas atrações com total conforto, hospitalidade e pé na areia.
        </p>
        <div className="pt-2">
          <Link
            to="/acomodacoes"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-wider shadow-2xl hover:scale-105 transition-all"
          >
            <span>Ver Nossas Suítes & Lofts</span>
          </Link>
        </div>
      </div>

      {/* 🔍 FULLSCREEN LIGHTBOX COM CARROSSEL PARA AS FOTOS DA MATÉRIA 🔍 */}
      {lightboxIndex !== null && galleryList[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-30 pb-3 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                Galeria da Matéria • Pousada Monte Alto
              </span>
              <h4 className="font-serif font-bold text-lg text-white">
                {title}
              </h4>
              <span className="text-xs text-stone-400">
                Foto {lightboxIndex + 1} de {galleryList.length}
              </span>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Photo Center */}
          <div className="relative flex-1 flex items-center justify-center my-3 overflow-hidden" onClick={e => e.stopPropagation()}>
            <img
              src={galleryList[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[78vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl select-none"
            />

            {/* Prev / Next Buttons */}
            {galleryList.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-6 p-4 rounded-full bg-black/70 hover:bg-amber-500 hover:text-stone-950 text-white transition-all shadow-2xl hover:scale-110"
                  title="Foto Anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-6 p-4 rounded-full bg-black/70 hover:bg-amber-500 hover:text-stone-950 text-white transition-all shadow-2xl hover:scale-110"
                  title="Próxima Foto"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {galleryList.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-30 scrollbar-thin" onClick={e => e.stopPropagation()}>
              {galleryList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-14 sm:h-16 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-stone-900 ${
                    lightboxIndex === idx
                      ? 'border-amber-500 scale-105 ring-2 ring-amber-400/60'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
