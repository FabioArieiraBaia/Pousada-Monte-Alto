import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Navigation, Compass, ExternalLink, 
  Car, Plane, CheckCircle2, Copy, Sparkles, Map, ShieldCheck
} from 'lucide-react';

export default function LocationMapSection({ className = "" }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Exact location details
  const address = "Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ, CEP 28930-000";
  const coordinates = "-22.9288,-42.0615";
  const placeName = "Pousada Monte Alto - Arraial do Cabo";

  // Navigation Links with Direct GPS Routing
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeName + ', ' + address)}`;
  const wazeRouteUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          Fácil Acesso & GPS
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl">
          Como Chegar na Pousada Monte Alto
        </h2>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          Localização privilegiada pé na areia em Monte Alto, com acesso direto pela RJ-102 sem enfrentar os engarrafamentos do centro de Arraial do Cabo.
        </p>
      </div>

      {/* Main Glass Card Container */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
        
        {/* Top Highlight Banner with Route Action Buttons */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Address & Pin */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-500 text-stone-950 text-xs font-black uppercase px-3 py-1 rounded-full shadow-md">
                <MapPin className="w-3.5 h-3.5 fill-stone-950" />
                <span>Localização Exata da Pousada</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Pousada Monte Alto
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl font-light">
                {address}
              </p>
            </div>

            {/* Quick Copy Address Button */}
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-white/20 transition-all shrink-0 self-start md:self-auto"
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

          {/* 🚀 HIGH-EMPHASIS GPS ROUTE BUTTONS 🚀 */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-3">
              ⚡ Toque para iniciar a navegação GPS direto no seu app:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Google Maps Route */}
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <Navigation className="w-5 h-5 fill-stone-950" />
                <span>Traçar Rota no Google Maps</span>
              </a>

              {/* Waze Route */}
              <a
                href={wazeRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <Car className="w-5 h-5" />
                <span>Traçar Rota no Waze</span>
              </a>

              {/* Apple Maps / Uber */}
              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-4 px-4 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <Compass className="w-5 h-5 text-amber-400" />
                <span>Abrir no Apple Maps</span>
              </a>

            </div>
          </div>
        </div>

        {/* Embedded Interactive Map */}
        <div className="relative h-96 sm:h-[480px] w-full bg-stone-100">
          <iframe
            title="Localização da Pousada Monte Alto em Arraial do Cabo"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14704.281898716805!2d-42.07221295!3d-22.92955895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9717cb49b4b02d%3A0xb3638dbf03b53c15!2sMonte%20Alto%2C%20Arraial%20do%20Cabo%20-%20RJ!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />

          {/* Floating Floating GPS Pill over Map */}
          <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-white/20 shadow-xl flex items-center gap-2.5 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <strong className="block text-xs font-serif text-amber-400">Pousada Monte Alto</strong>
              <span className="text-[10px] text-stone-300">Entre a Praia de Monte Alto e a Lagoa</span>
            </div>
          </div>
        </div>

        {/* Access Guides & Directions */}
        <div className="p-6 sm:p-8 bg-stone-50/80 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-800">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Car className="w-5 h-5 text-amber-600 shrink-0" />
              <h4>De Carro (Vindo do Rio / RJ)</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Pela Ponte Rio-Niterói e Via Lagos (RJ-124), siga pela RJ-102 direto para Monte Alto. Não precisa enfrentar o trânsito do centro de Arraial ou Cabo Frio.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Plane className="w-5 h-5 text-cyan-600 shrink-0" />
              <h4>Do Aeroporto de Cabo Frio</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              A apenas <strong>10 minutos de carro (8 km)</strong> do Aeroporto Internacional de Cabo Frio (CFB) pela rodovia RJ-102.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4>Ponto de Referência</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Localizada no Distrito de Monte Alto, a poucos passos da faixa de areia do mar e a 3 minutos da orla da Lagoa de Araruama.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
