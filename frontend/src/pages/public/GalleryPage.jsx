import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Camera, X, ChevronLeft, ChevronRight, ArrowLeft, 
  Sparkles, Maximize2, Filter
} from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function GalleryPage() {
  const { t } = useTranslation();
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    api.getGallery()
      .then(res => {
        setGallery(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { key: 'all', label: t('gallery.categoryAll', { defaultValue: 'Todas as Fotos' }) },
    { key: 'pousada', label: t('gallery.categoryPousada', { defaultValue: 'A Pousada' }) },
    { key: 'suites', label: t('gallery.categorySuites', { defaultValue: 'Suítes & Lofts' }) },
    { key: 'praia', label: t('gallery.categoryPraia', { defaultValue: 'Praias de Arraial' }) },
    { key: 'lagoa', label: t('gallery.categoryLagoa', { defaultValue: 'Lagoa & Pôr do Sol' }) },
  ];

  const matchesCategory = (itemCat, filterKey) => {
    if (filterKey === 'all') return true;
    const cat = (itemCat || '').toLowerCase().trim();
    if (filterKey === 'lagoa') return cat === 'lagoa' || cat === 'sunset';
    if (filterKey === 'pousada') return cat === 'pousada' || cat === 'areas_comuns' || cat === 'geral';
    if (filterKey === 'praia') return cat === 'praia';
    if (filterKey === 'suites') return cat === 'suites' || cat === 'suite';
    return cat === filterKey;
  };

  const getDisplayCategory = (itemCat) => {
    const cat = (itemCat || '').toLowerCase().trim();
    if (cat === 'lagoa' || cat === 'sunset') return t('gallery.categoryLagoa', { defaultValue: 'Lagoa & Pôr do Sol' });
    if (cat === 'praia') return t('gallery.categoryPraia', { defaultValue: 'Praias de Arraial' });
    if (cat === 'suites' || cat === 'suite') return t('gallery.categorySuites', { defaultValue: 'Suítes & Lofts' });
    return t('gallery.categoryPousada', { defaultValue: 'A Pousada' });
  };

  const filteredItems = activeCategory === 'all'
    ? gallery
    : gallery.filter(item => matchesCategory(item.category, activeCategory));

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (!filteredItems.length) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (!filteredItems.length) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredItems]);

  const currentPhoto = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      <SEOHead
        title="Galeria de Fotos Completa - Pousada Monte Alto"
        description="Conheça nossos espaços, suítes, lofts, área de lazer, praias e o pôr do sol inesquecível da Pousada Monte Alto em Arraial do Cabo."
      />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('gallery.backHome', { defaultValue: 'Voltar à Página Inicial' })}</span>
        </Link>

        <span className="text-xs bg-black/60 backdrop-blur-md text-amber-400 font-bold px-4 py-2 rounded-full border border-white/10 shadow-md">
          📸 {gallery.length} fotos disponíveis
        </span>
      </div>

      {/* Title Section */}
      <div className="bg-black/55 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          Nossos Espaços & Cenários
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] tracking-tight">
          {t('gallery.title', { defaultValue: 'Galeria de Fotos' })}
        </h1>
        <p className="text-stone-300 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {t('gallery.subtitle', { defaultValue: 'Explore cada detalhe e recanto da Pousada Monte Alto, nossas praias e o pôr do sol inesquecível.' })}
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setLightboxIndex(null);
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md shrink-0 ${
              activeCategory === cat.key
                ? 'bg-amber-500 text-stone-950 scale-105 ring-2 ring-amber-400/50'
                : 'bg-black/60 backdrop-blur-md text-stone-300 hover:text-white hover:bg-black/80 border border-white/15'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-300 text-sm mt-4">Carregando galeria de fotos...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md p-12 rounded-3xl text-center max-w-md mx-auto shadow-xl space-y-2">
          <p className="text-stone-700 font-bold text-base">Nenhuma foto cadastrada nesta categoria.</p>
          <p className="text-stone-500 text-xs">Selecione "Todas as Fotos" para ver todo o acervo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((img, idx) => (
            <div
              key={img.id || idx}
              onClick={() => setLightboxIndex(idx)}
              className="group relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-2xl bg-stone-950 border border-white/20 cursor-pointer hover:border-amber-400/60 transition-all duration-300"
            >
              <img
                src={img.image_url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end justify-between p-5">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    {getDisplayCategory(img.category)}
                  </span>
                  <h3 className="text-white text-sm sm:text-base font-serif font-bold drop-shadow-md">
                    {img.title}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔍 FULLSCREEN LIGHTBOX WITH PREV/NEXT SCROLL & THUMBNAILS 🔍 */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-30 pb-3 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                Galeria Pousada Monte Alto
              </span>
              <h4 className="font-serif font-bold text-lg sm:text-xl text-white">
                {currentPhoto.title}
              </h4>
              <span className="text-xs text-stone-400">
                Foto {lightboxIndex + 1} de {filteredItems.length}
              </span>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Photo Center */}
          <div className="relative flex-1 flex items-center justify-center my-3 overflow-hidden" onClick={e => e.stopPropagation()}>
            <img
              src={currentPhoto.image_url}
              alt={currentPhoto.title}
              className="max-h-[80vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl select-none"
            />

            {/* Prev / Next Buttons */}
            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 p-4 rounded-full bg-black/70 hover:bg-amber-500 hover:text-stone-950 text-white transition-all shadow-2xl hover:scale-110"
                  title="Foto Anterior (Seta Esquerda)"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 p-4 rounded-full bg-black/70 hover:bg-amber-500 hover:text-stone-950 text-white transition-all shadow-2xl hover:scale-110"
                  title="Próxima Foto (Seta Direita)"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Carousel */}
          {filteredItems.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-30 scrollbar-thin" onClick={e => e.stopPropagation()}>
              {filteredItems.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-14 sm:h-16 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-stone-900 ${
                    lightboxIndex === idx
                      ? 'border-amber-500 scale-105 ring-2 ring-amber-400/60'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
