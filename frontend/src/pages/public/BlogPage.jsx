import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, Clock, Video, ArrowRight, ChevronRight, Tag } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getBlogPosts(true)
      .then(res => setPosts(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      <SEOHead
        title="Dicas de Turismo em Arraial do Cabo - Blog da Pousada Monte Alto"
        description="Confira as melhores dicas de praias, passeios de barco, gastronomia e roteiros em Arraial do Cabo e Região dos Lagos."
      />

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          {t('blog.badge')}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white drop-shadow-2xl">
          {t('blog.title')}
        </h1>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {t('blog.subtitle')}
        </p>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-96 bg-white/20 backdrop-blur-md rounded-3xl animate-pulse border border-white/20" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => {
            const title = post[`title_${lang}`] || post.title_pt;
            const excerpt = post[`excerpt_${lang}`] || post.excerpt_pt;
            const tags = post.tags ? post.tags.split(',') : [];

            return (
              <article
                key={post.id}
                className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col justify-between group hover:shadow-2xl transition-all"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-stone-100">
                    <img
                      src={post.featured_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {post.youtube_video_url && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Video className="w-3 h-3" />
                        Vídeo Incluso
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>

                    <h2 className="font-serif font-bold text-xl text-stone-900 group-hover:text-amber-600 transition-colors">
                      <Link to={`/blog/${post.slug}`}>
                        {title}
                      </Link>
                    </h2>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light line-clamp-3">
                      {excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-medium">
                    {t('blog.readTime')}
                  </span>

                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-stone-900 hover:text-amber-600 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>{t('blog.readMore')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/50 space-y-3 shadow-xl">
          <BookOpen className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            Nenhum artigo publicado ainda
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm">
            Em breve compartilharemos dicas imperdíveis sobre Arraial do Cabo.
          </p>
        </div>
      )}

    </div>
  );
}
