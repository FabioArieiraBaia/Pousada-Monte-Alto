import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Waves, Sun, Compass, Car, 
  Clock, ShieldCheck, Heart, Award, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import LocationMapSection from '../../components/LocationMapSection';

export default function AboutLocationPage() {
  const { t } = useTranslation();

  const attractions = [
    {
      name: t('about.beach1'),
      time: 'Pé na areia (0 min)',
      distance: 'Na porta da pousada',
      desc: t('about.beach1Desc'),
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: t('about.beach2'),
      time: '3 min de caminhada / carro',
      distance: '500 metros',
      desc: t('about.beach2Desc'),
      photo: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: t('about.beach3'),
      time: '10-12 min de carro',
      distance: '9 km',
      desc: t('about.beach3Desc'),
      photo: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: t('about.beach4'),
      time: '15 min de carro',
      distance: '12 km',
      desc: t('about.beach4Desc'),
      photo: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: t('about.beach5'),
      time: '20 min de carro',
      distance: '15 km',
      desc: t('about.beach5Desc'),
      photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: t('about.beach6'),
      time: '18 min de carro + trilha',
      distance: '13 km',
      desc: t('about.beach6Desc'),
      photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      <SEOHead
        title="Quem Somos e Localização em Arraial do Cabo"
        description="Conheça a história e a localização privilegiada da Pousada Monte Alto, entre o mar e a Lagoa de Araruama em Arraial do Cabo - RJ."
      />

      {/* Header Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          {t('about.badge')}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white drop-shadow-2xl">
          {t('about.title')}
        </h1>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Concept & History Card */}
      <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/50 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
              Nossa Proposta de Hospitalidade
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Onde o Mar encontra a Paz e a Natureza
            </h2>
          </div>

          <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-light">
            A Pousada Monte Alto nasceu com a vocação de proporcionar aos viajantes uma experiência autêntica, aconchegante e sem as aglomerações e trânsito do centro urbano de Arraial do Cabo.
          </p>

          <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-light">
            Situada no charmoso distrito de Monte Alto, a pousada está a passos da praia com areias brancas infinitas e a poucos minutos da Lagoa de Araruama — famosa pelo pôr do sol mais espetacular de toda a Região dos Lagos.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200">
              <strong className="block text-stone-900 font-serif text-lg">Pé na Areia</strong>
              <span className="text-xs text-stone-600">Acesso direto e rápido à praia</span>
            </div>
            <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200">
              <strong className="block text-stone-900 font-serif text-lg">Pet Friendly 🐾</strong>
              <span className="text-xs text-stone-600">Seu companheiro sempre junto</span>
            </div>
          </div>
        </div>

        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-lg border border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
            alt="Praia de Monte Alto"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <span className="text-white text-sm font-semibold">Praia de Monte Alto em frente à pousada</span>
          </div>
        </div>
      </div>

      {/* 🚀 HIGH-EMPHASIS GPS MAP & ROUTE TRACING SECTION */}
      <LocationMapSection />

      {/* Guide of Beaches */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
            {t('about.guideTitle')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            Guia de Distâncias & Praias
          </h2>
          <p className="text-stone-300 text-sm drop-shadow-md">
            {t('about.guideSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {attractions.map((att, idx) => (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col justify-between group hover:shadow-2xl transition-all"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-stone-100">
                  <img
                    src={att.photo}
                    alt={att.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{att.time}</span>
                  </div>
                </div>

                <div className="p-6 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-amber-600 transition-colors">
                      {att.name}
                    </h3>
                    <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">
                      {att.distance}
                    </span>
                  </div>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
                    {att.desc}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(att.name + ' Arraial do Cabo')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-800 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Traçar Rota no Google Maps</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
