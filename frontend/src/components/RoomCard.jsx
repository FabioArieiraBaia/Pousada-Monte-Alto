import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, PawPrint, Tv, Wind, Wifi, Coffee, 
  Sparkles, Eye, ChevronRight, Video, BedDouble, Bath
} from 'lucide-react';

export default function RoomCard({ room, onOpenBooking }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  // Dynamic names & descriptions based on language
  const name = room[`name_${lang}`] || room.name_pt;
  const description = room[`description_${lang}`] || room.description_pt;
  const coverPhoto = room.cover_photo || (room.photos && room.photos[0]?.photo_url) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200/80 transition-all duration-300 flex flex-col group">
      {/* Cover Image Container */}
      <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-100">
        <img
          src={coverPhoto}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          {/* Type Badge */}
          <span className="bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10 shadow-sm">
            {room.type === 'loft' ? 'Loft / Bangalô' : 'Suíte Exclusiva'}
          </span>

          {/* Pet Friendly Badge */}
          {room.accepts_pets == 1 ? (
            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <PawPrint className="w-3.5 h-3.5" />
              <span>Pet Friendly</span>
            </span>
          ) : (
            <span className="bg-stone-800/80 backdrop-blur-md text-stone-300 text-[10px] px-2 py-1 rounded-full">
              Sem pets
            </span>
          )}
        </div>

        {/* Bottom Image Overlay: Max Guests & YouTube indicator */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('room.maxGuests', { count: room.max_guests })}</span>
          </div>

          {room.youtube_video_url && (
            <div className="flex items-center gap-1 bg-red-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <Video className="w-3 h-3" />
              <span>Vídeo Tour</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-600 transition-colors">
            {name}
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 mt-2 leading-relaxed">
            {description}
          </p>

          {/* Key Amenities Preview */}
          <div className="flex flex-wrap gap-2 mt-4">
            {amenitiesList.slice(0, 4).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-sand-100 text-stone-700 px-2.5 py-1 rounded-lg border border-sand-200"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{t(`room.amenity_${amenity}`, { defaultValue: amenity })}</span>
              </span>
            ))}
            {amenitiesList.length > 4 && (
              <span className="text-[11px] font-medium text-stone-400 py-1">
                +{amenitiesList.length - 4} mais
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
              A partir de
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600 font-serif">
                {formatCurrency(room.base_price)}
              </span>
              <span className="text-xs text-stone-500 font-medium">/ noite</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/acomodacoes/${room.slug}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1"
            >
              <span>{t('room.details')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            {onOpenBooking && (
              <button
                onClick={() => onOpenBooking(room)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 shadow-sm transition-all"
              >
                {t('nav.bookNow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
