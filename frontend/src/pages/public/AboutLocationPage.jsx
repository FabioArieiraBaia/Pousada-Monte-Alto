import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Compass, Waves, Sun, Clock, 
  Sparkles, CheckCircle2, ChevronRight, Eye, ExternalLink
} from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import LocationMapSection from '../../components/LocationMapSection';
import { api } from '../../services/api';

export default function AboutLocationPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(true);

  useEffect(() => {
    api.getAttractions()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setAttractions(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingAttractions(false));
  }, []);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      <SEOHead
        title="Quem Somos e Localização em Arraial do Cabo"
        description="Conheça a história e a localização privilegiada da Pousada Monte Alto, entre o mar e a Lagoa de Araruama em Arraial do Cabo - RJ."
      />

      {/* Header Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          {t('about.badge', { defaultValue: 'Nossa História & Localização' })}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white drop-shadow-2xl">
          {t('about.title', { defaultValue: 'Quem Somos & Localização' })}
        </h1>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {t('about.subtitle', { defaultValue: 'Conheça a Pousada Monte Alto e os encantos do Caribe Brasileiro' })}
        </p>
      </div>

      {/* Concept & History Card */}
      <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/50 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Hospitalidade Acolhedora
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {t('about.ourStoryTitle', { defaultValue: 'Nossa História e Proposta' })}
            </h2>
          </div>

          <p className="text-stone-700 leading-relaxed text-sm sm:text-base font-light">
            {t('about.story1', { defaultValue: 'A Pousada Monte Alto nasceu do sonho de oferecer uma hospedagem acolhedora, com atendimento familiar e perto da natureza, em um dos pontos mais privilegiados da Região dos Lagos.' })}
          </p>

          <p className="text-stone-700 leading-relaxed text-sm sm:text-base font-light">
            {t('about.story2', { defaultValue: 'Situada no charmoso distrito de Monte Alto, na Restinga de Massambaba, nossa localização é um verdadeiro refúgio: pé na areia para o mar e a apenas 3 minutos do pôr do sol na Lagoa de Araruama.' })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
              <Waves className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-stone-800">Pé na areia para o oceano</span>
            </div>
            <div className="flex items-center gap-3 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
              <Sun className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-stone-800">Pôr do sol na Lagoa a 3 min</span>
            </div>
          </div>
        </div>

        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
            alt="Praia de Monte Alto em Arraial do Cabo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <span className="text-white text-xs font-medium backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full border border-white/20">
              📍 Praia de Monte Alto • Arraial do Cabo - RJ
            </span>
          </div>
        </div>
      </div>

      {/* 🧭 LOCATION AND HIGH-EMPHASIS GPS ROUTE SECTION */}
      <LocationMapSection />

      {/* 🏖️ DYNAMIC BEACHES & DISTANCE GUIDE (CMS POWERED) */}
      <div className="space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
            {t('about.guideBadge', { defaultValue: 'Distâncias & Roteiros' })}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            {t('about.guideTitle', { defaultValue: 'Guia de Distâncias & Praias' })}
          </h2>
          <p className="text-stone-200 text-sm max-w-2xl mx-auto drop-shadow-md">
            {t('about.guideSub', { defaultValue: 'Descubra as praias mais deslumbrantes da Região dos Lagos com tempos de deslocamento e rotas GPS a partir da Pousada Monte Alto.' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {attractions.map((att, idx) => {
            const name = att[`name_${lang}`] || att.name_pt;
            const description = att[`description_${lang}`] || att.description_pt;
            const duration = att[`duration_badge_${lang}`] || att.duration_badge_pt;
            const distance = att[`distance_label_${lang}`] || att.distance_label_pt;
            const mapsUrl = att.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ' Arraial do Cabo')}`;

            return (
              <div
                key={att.id || idx}
                className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col justify-between group hover:shadow-2xl transition-all"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-stone-900">
                    <img
                      src={att.image_url}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {duration && (
                      <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-amber-600 transition-colors">
                        {name}
                      </h3>
                      {distance && (
                        <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap bg-stone-100 px-2 py-0.5 rounded-md">
                          {distance}
                        </span>
                      )}
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light line-clamp-3">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Dual Action Buttons: [ Ver Detalhes ] + [ Traçar Rota ] */}
                <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                  <Link
                    to={`/praias/${att.slug}`}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02]"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-950" />
                    <span>{t('about.seeDetails', { defaultValue: 'Ver Detalhes' })}</span>
                  </Link>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('about.traceRoute', { defaultValue: 'Traçar Rota' })}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
