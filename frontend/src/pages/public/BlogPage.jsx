import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Video, ArrowRight, BookOpen, Tag } from 'lucide-react';
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
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
          Dicas & Roteiros
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
          {t('blog.title')}
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t('blog.subtitle')}
        </p>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-80 bg-stone-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => {
            const title = post[`title_${lang}`] || post.title_pt;
            const excerpt = post[`excerpt_${lang}`] || post.excerpt_pt;
            
            return (
              <article
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200/80 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="h-56 relative overflow-hidden bg-stone-100">
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
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('blog.readTime')}</span>
                    </div>

                    <h2 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-600 transition-colors leading-snug">
                      {title}
                    </h2>

                    <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <span>{t('blog.readMore')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
          <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-2" />
          <p className="text-stone-600 text-sm">Nenhum artigo publicado no momento.</p>
        </div>
      )}

    </div>
  );
}
