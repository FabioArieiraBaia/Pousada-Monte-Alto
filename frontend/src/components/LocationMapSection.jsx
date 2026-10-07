import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Navigation, Compass, ExternalLink, 
  Car, Plane, CheckCircle2, Copy, Sparkles, Map, 
  ShieldCheck, Waves, Sun, Anchor, Layers, Star
} from 'lucide-react';

export default function LocationMapSection({ className = "", settings = {} }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);
  const [copied, setCopied] = useState(false);
  const [mapMode, setMapMode] = useState('roadmap'); // 'roadmap' | 'satellite' | 'hybrid'

  // Exact location details (Dynamic from CMS with fallback)
  const address = settings.loc_address || settings.address || "Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ, CEP 28930-000";
  const placeName = settings.pousada_name || "Pousada Monte Alto";
  const pousadaPhoto = settings.about_image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

  // Official Google Travel / Listing link
  const googleTravelUrl = "https://www.google.com/travel/search?q=pousada%20monte%20alto&hl=pt-BR&gl=br";

  // Dynamic texts with language resolution
  const badgeText = settings[`loc_badge_${lang}`] || settings.loc_badge_pt || "Localização Privilegiada & GPS";
  const titleText = settings[`loc_title_${lang}`] || settings.loc_title_pt || "Como Chegar na Pousada Monte Alto";
  const subtitleText = settings[`loc_subtitle_${lang}`] || settings.loc_subtitle_pt || "A Pousada Monte Alto fica em uma das faixas de terra mais exclusivas do Brasil: de um lado o mar azul do Caribe Brasileiro (pé na areia) e do outro o espetacular pôr do sol na Lagoa de Araruama.";

  const dirCarText = settings[`loc_directions_car_${lang}`] || settings.loc_directions_car_pt || "Pela Ponte Rio-Niterói e Via Lagos (RJ-124), siga pela RJ-102 direto para Monte Alto. Não precisa enfrentar o trânsito do centro de Arraial do Cabo ou Cabo Frio.";
  const dirAirportText = settings[`loc_directions_airport_${lang}`] || settings.loc_directions_airport_pt || "A apenas 10 minutos de carro (8 km) do Aeroporto Internacional de Cabo Frio (CFB) pela rodovia RJ-102.";
  const dirRefText = settings[`loc_directions_ref_${lang}`] || settings.loc_directions_ref_pt || "Localizada no charmoso Distrito de Monte Alto, a 50 metros da faixa de areia do oceano e a 3 minutos da orla da Lagoa de Araruama.";

  // Navigation Links with Direct GPS Routing
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeName + ', ' + address)}`;
  const wazeRouteUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;

  // Build exact embed URL based on map mode (m = roadmap, k = satellite, h = hybrid)
  const searchQuery = encodeURIComponent("Pousada Monte Alto, Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ");
  const embedModeParam = mapMode === 'satellite' ? 'k' : mapMode === 'hybrid' ? 'h' : 'm';
  const dynamicMapEmbedUrl = `https://maps.google.com/maps?q=${searchQuery}&t=${embedModeParam}&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Immediate Proximities Radar Items
  const proximities = [
    {
      icon: Waves,
      title: "Praia de Monte Alto",
      distance: "50 metros",
      label: "Pé na areia para o mar",
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20"
    },
    {
      icon: Sun,
      title: "Lagoa de Araruama",
      distance: "3 min a pé",
      label: "Pôr do sol cinematográfico",
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20"
    },
    {
      icon: Plane,
      title: "Aeroporto Cabo Frio",
      distance: "10 min de carro",
      label: "8 km direto pela RJ-102",
      color: "text-sky-400",
      bg: "bg-sky-400/10 border-sky-400/20"
    },
    {
      icon: Anchor,
      title: "Cais dos Passeios",
      distance: "15 min de carro",
      label: "Acesso rápido sem trânsito",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20"
    }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl">
          {titleText}
        </h2>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {subtitleText}
        </p>
      </div>

      {/* 🧭 PROXIMITY RADAR BAR (4 DISTÂNCIAS IMEDIATAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {proximities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${item.bg} bg-stone-900/70 border-white/10`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                  {item.distance}
                </span>
              </div>
              <h4 className="font-serif font-bold text-white text-sm sm:text-base">
                {item.title}
              </h4>
              <p className="text-stone-300 text-xs mt-0.5 font-light">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Glass Card Container */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
        
        {/* Top Highlight Banner with Address & Actions */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Address & Pin */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-500 text-stone-950 text-xs font-black uppercase px-3 py-1 rounded-full shadow-md">
                <MapPin className="w-3.5 h-3.5 fill-stone-950" />
                <span>Ponto Oficial Pousada Monte Alto</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white flex flex-wrap items-center gap-3">
                <span>{placeName}</span>
                <span className="text-amber-400 text-xs font-sans font-normal border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                  Arraial do Cabo - RJ
                </span>
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl font-light">
                {address}
              </p>
            </div>

            {/* Quick Actions: Copy Address + Google Travel Profile */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={googleTravelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold px-4 py-2.5 rounded-2xl border border-amber-500/30 transition-all cursor-pointer"
                title="Ver perfil oficial no Google Travel e Avaliações"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Perfil no Google</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>

              <button
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-white/20 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Endereço Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copiar Endereço</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 🚀 HIGH-EMPHASIS GPS ROUTE BUTTONS 🚀 */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-3">
              ⚡ Toque para iniciar a navegação GPS direto no seu app favorito:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Google Maps Route */}
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4 fill-stone-950" />
                <span>Navegar no Google Maps</span>
              </a>

              {/* Waze Route */}
              <a
                href={wazeRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Car className="w-4 h-4" />
                <span>Navegar no Waze</span>
              </a>

              {/* Apple Maps */}
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Navegar no Apple Maps</span>
              </a>

            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE MAP CONTAINER WITH OVERLAYS & CONTROLS       */}
        {/* ======================================================== */}
        <div className="relative h-[440px] sm:h-[560px] w-full bg-stone-900 overflow-hidden">
          
          {/* Iframe with Google Maps */}
          <iframe
            key={mapMode}
            title="Localização da Pousada Monte Alto em Arraial do Cabo"
            src={dynamicMapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />

          {/* 🛰️ LAYER SELECTOR SWITCHER (MAPA DE RUAS / SATÉLITE / HÍBRIDO) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-stone-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
            <button
              onClick={() => setMapMode('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mapMode === 'roadmap'
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title="Visualizar mapa de ruas e acessos"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Ruas</span>
            </button>

            <button
              onClick={() => setMapMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mapMode === 'satellite'
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title="Visualizar foto de satélite da Restinga de Massambaba"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satélite</span>
            </button>

            <button
              onClick={() => setMapMode('hybrid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mapMode === 'hybrid'
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title="Visualizar satélite com nomes de ruas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Híbrido</span>
            </button>
          </div>

          {/* 🎯 RADAR OVERLAY CARD (FLOATING AT BOTTOM-LEFT) */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-20 bg-stone-950/90 backdrop-blur-xl border border-white/25 p-4 rounded-3xl shadow-2xl text-white space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-amber-500/40 shadow-md">
                <img 
                  src={pousadaPhoto} 
                  alt={placeName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                    Local Exato Confirmado
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-white truncate">
                  {placeName}
                </h4>
                <p className="text-[11px] text-stone-300 truncate">
                  Travessa Américo Reis • Monte Alto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-stone-300">
                <Waves className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Pé na areia (50m)</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-300">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Pôr do Sol (3 min)</span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs py-2 rounded-xl text-center shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 fill-stone-950" />
                <span>Como Chegar</span>
              </a>

              <a
                href={googleTravelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                title="Abrir perfil oficial no Google Travel"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Access Guides & Directions (Roads & Airport) */}
        <div className="p-6 sm:p-8 bg-stone-50/80 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-800">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Car className="w-5 h-5 text-amber-600 shrink-0" />
              <h4>De Carro (Vindo do Rio / RJ)</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {dirCarText}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Plane className="w-5 h-5 text-cyan-600 shrink-0" />
              <h4>Do Aeroporto de Cabo Frio</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {dirAirportText}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4>Ponto de Referência</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {dirRefText}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
