import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowLeft, Video, Share2, Tag } from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
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

  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Back to Blog */}
      <div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('blog.backToBlog')}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            {new Date(post.published_at).toLocaleDateString('pt-BR')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {t('blog.readTime')}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 leading-tight">
          {title}
        </h1>
      </div>

      {/* Featured Cover Image */}
      {post.featured_image && (
        <div className="h-72 sm:h-96 rounded-3xl overflow-hidden shadow-lg bg-stone-100">
          <img
            src={post.featured_image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* YouTube Video Tour if attached */}
      {post.youtube_video_url && (
        <div className="space-y-3 pt-2">
          <YouTubeEmbed url={post.youtube_video_url} title={`Vídeo do Artigo: ${title}`} />
        </div>
      )}

      {/* Article Rich Content */}
      <div
        className="prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed space-y-4 pt-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Tags */}
      {post.tags && (
        <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-amber-600" />
          {post.tags.split(',').map((tag, idx) => (
            <span
              key={idx}
              className="text-xs bg-sand-100 text-stone-700 px-3 py-1 rounded-full border border-sand-200 font-medium"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Bottom CTA to View Accommodations */}
      <div className="bg-sand-100/80 p-8 rounded-3xl border border-sand-200 text-center space-y-3">
        <h3 className="font-serif text-2xl font-bold text-stone-900">
          Gostou das dicas de Arraial do Cabo?
        </h3>
        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
          Hospede-se na Pousada Monte Alto e aproveite cada uma dessas atrações com total conforto e tranquilidade.
        </p>
        <div className="pt-2">
          <Link
            to="/acomodacoes"
            className="inline-flex bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md"
          >
            Ver Nossas Suítes & Lofts
          </Link>
        </div>
      </div>

    </div>
  );
}
