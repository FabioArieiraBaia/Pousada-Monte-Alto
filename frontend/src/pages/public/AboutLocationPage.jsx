import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Waves, Sun, Compass, Car, 
  Clock, ShieldCheck, Heart, Award, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

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
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      <SEOHead
        title="Quem Somos e Localização em Monte Alto"
        description="Localização privilegiada na Restinga de Massambaba, Arraial do Cabo - RJ. Praia de Monte Alto pé na areia e a 3 min da Lagoa de Araruama."
      />

      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
          História & Destino
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
          {t('about.title')}
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t('about.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
              {t('about.ourStoryTitle')}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Um refúgio de paz em Arraial do Cabo
            </h2>
          </div>

          <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
            {t('about.story1')}
          </p>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
            {t('about.story2')}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-sand-100/70 p-4 rounded-2xl border border-sand-200">
              <span className="font-serif text-2xl font-bold text-amber-700 block">Pé na Areia</span>
              <span className="text-xs text-stone-600">Acesso imediato ao mar de Monte Alto</span>
            </div>
            <div className="bg-sand-100/70 p-4 rounded-2xl border border-sand-200">
              <span className="font-serif text-2xl font-bold text-amber-700 block">3 Minutos</span>
              <span className="text-xs text-stone-600">Do pôr do sol na Lagoa de Araruama</span>
            </div>
          </div>
        </div>

        <div className="relative h-96 sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl bg-stone-100">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
            alt="Pousada Monte Alto praia"
            className="w-full h-full object-cover"
            width="1200"
            height="800"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <span className="text-white text-sm font-semibold">Distrito de Monte Alto • Arraial do Cabo - RJ</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
            Roteiro Turístico
          </span>
          <h2 className="font-serif text-3xl font-bold text-stone-900">
            {t('about.locationGuideTitle')}
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm">
            Tudo o que você precisa conhecer durante sua estadia na Pousada Monte Alto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((att, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={att.photo}
                  alt={att.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width="800"
                  height="500"
                  decoding="async"
                />
                <span className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {att.time}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{att.distance}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                    {att.name}
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed mt-1">
                    {att.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
        <h3 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-amber-600" />
          <span>Localização Exata no Mapa</span>
        </h3>
        <p className="text-stone-600 text-xs sm:text-sm">
          Travessa Américo Reis, Distrito de Monte Alto, Arraial do Cabo - RJ, CEP 28930-000.
        </p>

        <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-inner border border-stone-200">
          <iframe
            title="Mapa Pousada Monte Alto"
            src="https://maps.google.com/maps?q=Monte%20Alto%20Arraial%20do%20Cabo%20RJ&t=&z=14&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>

    </div>
  );
}
