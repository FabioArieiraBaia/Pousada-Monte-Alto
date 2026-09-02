import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, PawPrint, Calendar, MessageCircle, 
  Check, ArrowLeft, Video, Sparkles, MapPin, 
  Clock, ShieldCheck, ChevronRight
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import BookingModal from '../../components/BookingModal';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function RoomDetailPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkoutDefault = new Date();
  checkoutDefault.setDate(checkoutDefault.getDate() + 4);

  const [checkIn, setCheckIn] = useState(tomorrow.toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(checkoutDefault.toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    api.getAccommodationBySlug(slug)
      .then(res => {
        setRoom(res.data);
        if (res.data?.photos && res.data.photos.length > 0) {
          setActivePhoto(res.data.photos[0].photo_url);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-500 text-sm mt-4">Carregando acomodação...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-stone-900">Acomodação não encontrada</h2>
        <Link to="/acomodacoes" className="text-amber-600 font-bold inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar para todas as acomodações
        </Link>
      </div>
    );
  }

  const name = room[`name_${lang}`] || room.name_pt;
  const description = room[`description_${lang}`] || room.description_pt;
  const photos = room.photos || [];

  let nights = 1;
  if (checkIn && checkOut) {
    const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    nights = Math.max(1, Math.round(diff));
  }
  const totalEstimated = nights * room.base_price;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];
  const pousadaWhatsApp = '5521969493569';
  const waMsg = `Olá! Gostaria de reservar a *${name}* de *${checkIn}* a *${checkOut}* (${nights} diárias) na Pousada Monte Alto.`;
  const directWhatsAppUrl = `https://wa.me/${pousadaWhatsApp}?text=${encodeURIComponent(waMsg)}`;

  const roomSchema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    "name": name,
    "description": description,
    "image": photos.map(p => p.photo_url),
    "occupancy": {
      "@type": "QuantitativeValue",
      "maxValue": room.max_guests
    },
    "petsAllowed": room.accepts_pets == 1,
    "offers": {
      "@type": "Offer",
      "price": room.base_price,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Dynamic SEO Head with HotelRoom Schema */}
      <SEOHead
        title={name}
        description={`${name} na Pousada Monte Alto em Arraial do Cabo. ${description?.substring(0, 150)}...`}
        image={activePhoto || (photos[0]?.photo_url)}
        schemaJson={roomSchema}
      />

      <div>
        <Link
          to="/acomodacoes"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as suítes e lofts</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                {room.type === 'loft' ? 'Loft / Bangalô' : 'Suíte Exclusiva'}
              </span>

              {room.accepts_pets == 1 ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                  {t('room.petsAllowed')}
                </span>
              ) : (
                <span className="bg-stone-100 text-stone-600 text-xs px-3 py-1 rounded-full">
                  {t('room.noPets')}
                </span>
              )}

              <span className="text-xs text-stone-500 font-medium flex items-center gap-1 ml-auto">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                {t('room.maxGuests', { count: room.max_guests })}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {name}
            </h1>
          </div>

          <div className="space-y-4">
            <div className="h-80 sm:h-[450px] rounded-3xl overflow-hidden bg-stone-100 shadow-lg border border-stone-200">
              <img
                src={activePhoto || (photos[0]?.photo_url)}
                alt={name}
                className="w-full h-full object-cover transition-all duration-500"
                width="1200"
                height="800"
                decoding="async"
              />
            </div>

            {photos.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(p.photo_url)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                      activePhoto === p.photo_url
                        ? 'border-amber-500 scale-105 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.photo_url}
                      alt={`${name} thumbnail ${idx}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="100"
                      height="100"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Sobre a Acomodação
            </h3>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              {t('room.amenities')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {amenitiesList.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-sand-50 border border-sand-200 text-stone-800 text-xs font-medium"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t(`room.amenity_${amenity}`, { defaultValue: amenity })}</span>
                </div>
              ))}
            </div>
          </div>

          {room.youtube_video_url && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                <span>Tour Virtual em Vídeo</span>
              </h3>
              <YouTubeEmbed url={room.youtube_video_url} title={`Tour Virtual - ${name}`} />
            </div>
          )}

          <div className="bg-sand-100/70 p-6 rounded-3xl border border-sand-200 space-y-3 text-xs text-stone-700">
            <h4 className="font-serif font-bold text-stone-900 text-sm">
              {t('room.policyTitle')}
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{t('room.checkinInfo')}</li>
              <li>{room.accepts_pets == 1 ? 'Acomodação Pet Friendly (animais de pequeno/médio porte bem-vindos).' : 'Esta acomodação específica não comporta animais de estimação.'}</li>
              <li>Voltagem padrão da região: 110V.</li>
              <li>Cancelamento gratuito até 7 dias antes do check-in.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-200/80 space-y-6">
            
            <div className="border-b border-stone-100 pb-4 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">
                  Tarifa padrão
                </span>
                <span className="text-3xl font-serif font-bold text-amber-600">
                  {formatCurrency(room.base_price)}
                </span>
              </div>
              <span className="text-xs text-stone-500 font-medium">/ noite</span>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-stone-600 uppercase block">
                Selecione as Datas da sua Estadia
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-sand-50 p-2.5 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-stone-500 block font-bold">CHECK-IN</span>
                  <input
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>

                <div className="bg-sand-50 p-2.5 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-stone-500 block font-bold">CHECK-OUT</span>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200 space-y-2 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>{formatCurrency(room.base_price)} x {nights} diárias:</span>
                <span>{formatCurrency(totalEstimated)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Taxa de limpeza:</span>
                <span>Inclusa</span>
              </div>
              <div className="pt-2 border-t border-sand-300 flex justify-between font-bold text-sm text-stone-900">
                <span>Total Estimado:</span>
                <span className="text-amber-700 font-serif text-lg">{formatCurrency(totalEstimated)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{t('room.instantBooking')}</span>
              </button>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('room.bookViaWhatsApp')}</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Atendimento direto com os proprietários
              </span>
            </div>

          </div>
        </div>

      </div>

      {isBookingOpen && (
        <BookingModal
          room={room}
          initialDates={{ check_in: checkIn, check_out: checkOut, guests: room.max_guests }}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

    </div>
  );
}
