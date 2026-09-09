import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, MapPin, Clock, Compass, Video, 
  Sparkles, ExternalLink, ShieldCheck, Heart, Calendar, MessageCircle
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function BeachDetailPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [beach, setBeach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAttractionBySlug(slug)
      .then(res => setBeach(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-36 pb-20 max-w-7xl mx-auto px-4 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-300 text-sm mt-4">Carregando informações da praia...</p>
      </div>
    );
  }

  if (!beach) {
    return (
      <div className="pt-36 pb-20 max-w-4xl mx-auto px-4 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-white drop-shadow-md">Praia ou atrativo não encontrado</h2>
        <Link to="/sobre-localizacao" className="text-amber-400 font-bold inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Guia de Praias
        </Link>
      </div>
    );
  }

  const name = beach[`name_${lang}`] || beach.name_pt;
  const description = beach[`description_${lang}`] || beach.description_pt;
  const tips = beach[`tips_${lang}`] || beach.tips_pt;
  const durationBadge = beach[`duration_badge_${lang}`] || beach.duration_badge_pt;
  const distanceLabel = beach[`distance_label_${lang}`] || beach.distance_label_pt;

  const googleMapsUrl = beach.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ' Arraial do Cabo')}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(name + ' Arraial do Cabo')}&navigate=yes`;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      <SEOHead
        title={`${name} - Guia de Praias de Arraial do Cabo`}
        description={description}
        image={beach.image_url}
      />

      {/* Back Button */}
      <div>
        <Link
          to="/sobre-localizacao"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('about.backToBeaches', { defaultValue: 'Voltar para o Guia de Praias' })}</span>
        </Link>
      </div>

      {/* Title & Badge Header (High Contrast Glass Container) */}
      <div className="bg-black/55 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-2 drop-shadow-sm">
            <span>Arraial do Cabo • Região dos Lagos</span>
            <span>•</span>
            <span className="text-stone-300">Ponto Turístico</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] tracking-tight">
            {name}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {durationBadge && (
            <span className="bg-amber-500 text-stone-950 text-xs font-black px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-950" />
              <span>{durationBadge}</span>
            </span>
          )}

          {distanceLabel && (
            <span className="bg-stone-900/90 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{distanceLabel}</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Image with Ambient Blurred Backdrop */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[560px] rounded-3xl overflow-hidden bg-stone-950 border border-white/25 shadow-2xl flex items-center justify-center group">
        <img
          src={beach.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <img
          src={beach.image_url}
          alt={name}
          className="relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
        />
      </div>

      {/* Content & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left: Description & Tips */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Compass className="w-6 h-6 text-amber-600" />
              <span>Sobre {name}</span>
            </h3>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light">
              {description}
            </p>
          </div>

          {/* Visitor Tips */}
          {tips && (
            <div className="bg-amber-50/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-200/80 space-y-3">
              <h4 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>{t('about.beachTips', { defaultValue: 'Dicas de Visitação' })}</span>
              </h4>
              <p className="text-stone-800 text-xs sm:text-sm leading-relaxed">
                {tips}
              </p>
            </div>
          )}

          {/* YouTube Video Tour if present */}
          {beach.youtube_video_url && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
                <Video className="w-5 h-5 text-red-500" />
                <span>{t('about.beachVirtualTour', { defaultValue: 'Tour Virtual em Vídeo' })}</span>
              </h3>
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                <YouTubeEmbed url={beach.youtube_video_url} title={`Vídeo de ${name}`} />
              </div>
            </div>
          )}

        </div>

        {/* Right: GPS Navigation & Pousada Monte Alto CTA */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* GPS Route Box */}
          <div className="sticky top-28 space-y-6">
            <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-5">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest block">
                  Navegação GPS em 1 Toque
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  Como Chegar
                </h3>
                <p className="text-stone-500 text-xs mt-1">
                  Inicie a rota no seu aplicativo de navegação favorito partindo da sua localização ou da Pousada Monte Alto.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-stone-900 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Traçar Rota no Google Maps</span>
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Traçar Rota no Waze</span>
                </a>
              </div>
            </div>

            {/* Pousada Monte Alto Booking Card */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider bg-stone-950 text-amber-400 px-2.5 py-1 rounded-full inline-block">
                Hospedagem Recomendada
              </span>
              <h4 className="font-serif text-2xl font-black leading-tight">
                Hospede-se na Pousada Monte Alto
              </h4>
              <p className="text-stone-950 text-xs leading-relaxed font-medium">
                Localizada estrategicamente entre a praia e a lagoa, com acesso rápido a todas as praias da Região dos Lagos sem passar pelo trânsito do centro.
              </p>
              <Link
                to="/acomodacoes"
                className="block w-full bg-stone-950 hover:bg-stone-900 text-white font-bold py-3.5 px-4 rounded-2xl text-center text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Ver Suítes & Lofts Disponíveis
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
