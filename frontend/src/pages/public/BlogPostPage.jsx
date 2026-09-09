import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowLeft, Video, Share2, Tag } from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getBlogPostBySlug(slug)
      .then(res => setPost(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

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

      {/* Back to Blog Button */}
      <div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('blog.backToBlog')}</span>
        </Link>
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
      <article className="bg-black/55 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-white/20 shadow-2xl space-y-6">
        <div
          className="blog-content text-white text-base sm:text-lg leading-relaxed space-y-4 font-normal"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags */}
        {post.tags && (
          <div className="pt-6 border-t border-white/15 flex flex-wrap items-center gap-2">
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

    </div>
  );
}
