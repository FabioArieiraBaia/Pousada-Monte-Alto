import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, PawPrint, Tv, Wind, Wifi, Coffee, 
  Sparkles, Eye, ChevronRight, Video, BedDouble, Bath, Flame, MessageCircle
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
  const isPetFriendly = Number(room.accepts_pets) === 1;
  const isPromo = room.is_promo !== undefined ? Number(room.is_promo) === 1 : true;

  const pousadaWhatsApp = '5521969493569';
  const waMsg = `Olá! Gostaria de consultar o valor promocional e disponibilidade para a *${name}* na Pousada Monte Alto.`;
  const directWhatsAppUrl = `https://wa.me/${pousadaWhatsApp}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Cover Image Container */}
        <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-100">
          <img
            src={coverPhoto}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

          {/* Top Badges (Balanced Single-Line Layout) */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            
            {/* Type Badge */}
            <span className="bg-stone-900/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/15 shadow-sm shrink-0 whitespace-nowrap">
              {room.type === 'loft' ? 'Loft Família' : 'Suíte Exclusiva'}
            </span>

            {/* Status Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Promo Badge */}
              {isPromo && (
                <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                  <Flame className="w-3 h-3 fill-stone-950" />
                  <span>Promoção</span>
                </span>
              )}

              {/* Pet Friendly Badge */}
              {isPetFriendly ? (
                <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <PawPrint className="w-3 h-3" />
                  <span>Pet Friendly</span>
                </span>
              ) : (
                <span className="bg-stone-800/80 backdrop-blur-md text-stone-300 text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                  Sem pets
                </span>
              )}
            </div>

          </div>

          {/* Bottom Image Overlay: Max Guests & YouTube indicator */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('room.maxGuests', { count: room.max_guests })}</span>
            </div>

            {room.youtube_video_url && (
              <span className="flex items-center gap-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <Video className="w-3 h-3" />
                <span>Vídeo Tour</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-600 transition-colors">
              {name}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 mt-1.5 leading-relaxed font-light">
              {description}
            </p>
          </div>

          {/* Quick Amenities Pill List */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {amenitiesList.slice(0, 4).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {t(`amenities.${amenity}`, { defaultValue: amenity.replace('_', ' ') })}
              </span>
            ))}
            {amenitiesList.length > 4 && (
              <span className="text-[10px] text-stone-400 font-semibold self-center">
                +{amenitiesList.length - 4} mais
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Price & Action Buttons */}
      <div className="p-6 pt-0 mt-2 border-t border-stone-100 flex flex-col gap-3">
        
        {/* Pricing Display: Strikethrough + Sob Consulta or Standard */}
        <div className="flex items-end justify-between pt-3">
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
              Tarifa da Acomodação
            </span>

            {isPromo ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="line-through text-stone-400 font-semibold text-xs sm:text-sm">
                  {formatCurrency(room.base_price)}
                </span>
                <span className="font-serif font-extrabold text-amber-600 text-base sm:text-lg tracking-tight">
                  Sob Consulta
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-serif font-extrabold text-stone-900 text-xl text-amber-600">
                  {formatCurrency(room.base_price)}
                </span>
                <span className="text-stone-400 text-xs font-normal">/noite</span>
              </div>
            )}
          </div>

          <Link
            to={`/acomodacoes/${room.slug}`}
            className="text-stone-700 hover:text-stone-900 text-xs font-bold py-2 px-3 rounded-xl hover:bg-stone-100 flex items-center gap-1 transition-colors"
          >
            <span>{t('room.details')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dual Booking Buttons: Form / WhatsApp */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenBooking && onOpenBooking(room)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs py-2.5 px-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.02]"
          >
            <span>{isPromo ? 'Consultar / Reservar' : t('room.bookNow')}</span>
          </button>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.02]"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Via WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
}
