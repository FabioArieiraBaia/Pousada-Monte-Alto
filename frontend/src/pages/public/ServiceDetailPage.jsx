import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Clock, Users, Calendar, CheckCircle2, 
  AlertCircle, ShieldCheck, Video, MessageCircle, 
  Sparkles, Compass, MapPin, Share2, Star, ChevronRight,
  Images, Maximize2, X, ChevronLeft,
  ExternalLink, Play
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/SocialIcons';
import { api } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import InstagramEmbed from '../../components/InstagramEmbed';
import ServiceBookingModal from '../../components/ServiceBookingModal';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    loadService();
  }, [slug]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, service]);

  const loadService = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getServiceBySlug(slug);
      if (res.data) {
        setService(res.data);
        setActivePhoto(res.data.cover_photo);
      } else {
        setError('Passeio não encontrado');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes do passeio');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 max-w-5xl mx-auto flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-400 text-sm">Carregando passeio...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Passeio não encontrado</h2>
        <p className="text-stone-400 text-sm">{error || 'O passeio solicitado não existe ou foi desativado.'}</p>
        <Link
          to="/servicos"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Passeios</span>
        </Link>
      </div>
    );
  }

  const allPhotos = [service.cover_photo, ...(service.gallery_photos || [])].filter((v, i, a) => v && a.indexOf(v) === i);

  const getLocalizedName = () => {
    if (i18n.language.startsWith('en') && service.name_en) return service.name_en;
    if (i18n.language.startsWith('es') && service.name_es) return service.name_es;
    return service.name_pt;
  };

  const getLocalizedDescription = () => {
    if (i18n.language.startsWith('en') && service.description_en) return service.description_en;
    if (i18n.language.startsWith('es') && service.description_es) return service.description_es;
    return service.description_pt;
  };

  const getLocalizedTagline = () => {
    if (i18n.language.startsWith('en') && service.tagline_en) return service.tagline_en;
    if (i18n.language.startsWith('es') && service.tagline_es) return service.tagline_es;
    return service.tagline_pt || '';
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-stone-100">
      <SEOHead
        title={`${service.name_pt} | Passeios Pousada Monte Alto`}
        description={service.tagline_pt || service.description_pt}
        image={service.cover_photo}
      />

      {/* Breadcrumb & Back */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/servicos"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Todos os Passeios</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="capitalize">{service.category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-200 font-semibold truncate max-w-[200px]">{getLocalizedName()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visuals & Content (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Photo & Gallery */}
          <div className="space-y-3">
            <div className="relative h-72 sm:h-[420px] rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950 group">
              <img
                src={activePhoto || service.cover_photo}
                alt={service.name_pt}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-stone-950/80 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{service.duration_label || 'Consulte'}</span>
                </span>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => {
                  const idx = allPhotos.findIndex(p => p === (activePhoto || service.cover_photo));
                  setLightboxIndex(idx >= 0 ? idx : 0);
                }}
                className="absolute bottom-4 right-4 px-3 py-1.5 bg-stone-950/80 hover:bg-amber-500 hover:text-stone-950 backdrop-blur-md text-stone-200 text-xs font-semibold rounded-xl border border-stone-700/50 transition-all flex items-center gap-1.5 shadow-lg"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Ver fotos ({allPhotos.length})</span>
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {allPhotos.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {allPhotos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(photoUrl)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      (activePhoto || service.cover_photo) === photoUrl ? 'border-amber-500 scale-105 shadow-md' : 'border-stone-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photoUrl} alt="miniatura" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Tagline */}
          <div className="space-y-2 border-b border-stone-800 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                {service.category === 'barco' ? 'Passeio Náutico' : service.category === 'mergulho' ? 'Mergulho Subaquático' : service.category === 'buggy' ? 'Aventura em Dunas' : 'Experiência'}
              </span>
              {service.partner_name && (
                <span className="text-stone-400 text-xs font-medium">
                  • Operado por {service.partner_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              {getLocalizedName()}
            </h1>

            {getLocalizedTagline() && (
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                {getLocalizedTagline()}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>Sobre o Roteiro & Experiência</span>
            </h3>
            <div className="text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-stone-900/60 p-6 rounded-3xl border border-stone-800/80">
              {getLocalizedDescription()}
            </div>
          </div>

          {/* Dedicated Photo Gallery Grid */}
          {allPhotos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Images className="w-5 h-5 text-amber-400" />
                  <span>Galeria de Fotos do Passeio</span>
                </h3>
                <span className="text-xs text-stone-400 font-medium">
                  {allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allPhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 cursor-pointer hover:border-amber-500/80 transition-all shadow-md hover:shadow-amber-500/10"
                  >
                    <img
                      src={photoUrl}
                      alt={`${service.name_pt} foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos & Social Media (YouTube, Instagram, Facebook) */}
          {(service.youtube_video_url || service.instagram_video_url || service.facebook_video_url) && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <span>Vídeos & Redes Sociais do Passeio</span>
              </h3>

              {/* YouTube Video Tour if present (normal 16:9 or Shorts 9:16) */}
              {service.youtube_video_url && (
                <div className="w-full">
                  <YouTubeEmbed url={service.youtube_video_url} title={service.name_pt} />
                </div>
              )}

              {/* Instagram Video / Reels Player Embed */}
              {service.instagram_video_url && (
                <div className="space-y-2">
                  <InstagramEmbed url={service.instagram_video_url} title={service.name_pt} />
                </div>
              )}

              {/* Facebook Card */}
              {service.facebook_video_url && (
                <div className="pt-2">
                  <a
                    href={service.facebook_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-stone-900 border border-blue-500/30 hover:border-blue-500 transition-all flex items-center justify-between group shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                        <FacebookIcon className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors block">
                          Ver no Facebook
                        </span>
                        <span className="text-[11px] text-stone-400">Vídeos & Publicações do Passeio</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-blue-400 transition-colors" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Included Items & Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* O que está incluso */}
            {service.included_items && service.included_items.length > 0 && (
              <div className="bg-stone-900/70 border border-stone-800/80 rounded-3xl p-6 space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>O que está incluso</span>
                </h4>
                <ul className="space-y-2.5">
                  {service.included_items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requisitos e Recomendações */}
            {service.requirements && service.requirements.length > 0 && (
              <div className="bg-stone-900/70 border border-stone-800/80 rounded-3xl p-6 space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Recomendações & O que levar</span>
                </h4>
                <ul className="space-y-2.5">
                  {service.requirements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget (1 col) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-stone-900/90 backdrop-blur-md rounded-3xl p-6 border border-stone-800 shadow-2xl space-y-6">
            
            {/* Price Header */}
            <div className="border-b border-stone-800 pb-5">
              <span className="text-xs text-stone-400 uppercase tracking-wider block font-semibold">Valor da Experiência</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-400 font-serif">
                  {formatCurrency(service.price_per_person)}
                </span>
                <span className="text-stone-400 text-xs">/ pessoa</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                {service.duration_label ? `Duração de aproximadamente ${service.duration_label}` : 'Consulte duração e horários'}
              </p>
            </div>

            {/* Guarantees */}
            <div className="space-y-2.5 text-xs text-stone-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Parceiros credenciados pela Capitania</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Reserva garantida e suporte da pousada</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Cancelamento flexível em caso de mau tempo</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setBookingModalOpen(true)}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar Minha Vaga</span>
              </button>

              <a
                href={`https://wa.me/5521969493569?text=${encodeURIComponent(`Olá! Estou na Pousada Monte Alto e gostaria de saber sobre o passeio *${service.name_pt}*. Quais os próximos dias disponíveis?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-2xl border border-stone-700 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
                <span>Dúvidas via WhatsApp</span>
              </a>
            </div>

            {/* Notice */}
            <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 text-[10px] text-stone-400 text-center leading-relaxed">
              💡 Os passeios estão sujeitos às condições climáticas e autorização da Marinha do Brasil para segurança de todos.
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <ServiceBookingModal
          service={service}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-serif font-bold text-sm sm:text-base">
                {getLocalizedName()}
              </span>
              <span className="text-stone-400 text-xs px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800">
                {lightboxIndex + 1} / {allPhotos.length}
              </span>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white flex items-center justify-center transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image & Arrows */}
          <div
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {allPhotos.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-stone-900/80 hover:bg-amber-500 hover:text-stone-950 text-white flex items-center justify-center backdrop-blur-md border border-stone-700/60 transition-all shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={allPhotos[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300 select-none"
            />

            {allPhotos.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-stone-900/80 hover:bg-amber-500 hover:text-stone-950 text-white flex items-center justify-center backdrop-blur-md border border-stone-700/60 transition-all shadow-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnails strip */}
          {allPhotos.length > 1 && (
            <div
              className="flex items-center gap-2 max-w-2xl overflow-x-auto py-2 px-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800/80 z-10 scrollbar-thin"
              onClick={(e) => e.stopPropagation()}
            >
              {allPhotos.map((photoUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-14 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    lightboxIndex === idx ? 'border-amber-500 scale-105 shadow-md' : 'border-stone-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
