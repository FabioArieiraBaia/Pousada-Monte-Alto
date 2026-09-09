import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, PawPrint, Calendar, MessageCircle, 
  Check, ArrowLeft, Video, Sparkles, MapPin, 
  Clock, ShieldCheck, ChevronRight, Flame, Tag, FileText
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
      <div className="pt-36 pb-20 max-w-7xl mx-auto px-4 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-300 text-sm mt-4">Carregando acomodação...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="pt-36 pb-20 max-w-4xl mx-auto px-4 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-white drop-shadow-md">Acomodação não encontrada</h2>
        <Link to="/acomodacoes" className="text-amber-400 font-bold inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar para todas as acomodações
        </Link>
      </div>
    );
  }

  const name = room[`name_${lang}`] || room.name_pt;
  const description = room[`description_${lang}`] || room.description_pt;
  const photos = room.photos || [];
  const isPromo = room.is_promo !== undefined ? Number(room.is_promo) === 1 : true;

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
  const waMsg = `Olá! Gostaria de consultar os valores promocionais e disponibilidade para a *${name}* de *${checkIn}* a *${checkOut}* (${nights} diárias) na Pousada Monte Alto.`;
  const directWhatsAppUrl = `https://wa.me/${pousadaWhatsApp}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      <SEOHead
        title={`${name} - Pousada Monte Alto`}
        description={description}
        image={photos[0]?.photo_url}
      />

      {/* Back Button & Top Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/acomodacoes"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as acomodações</span>
        </Link>

        {isPromo && (
          <span className="bg-amber-500 text-stone-950 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-stone-950" />
            <span>Tarifa Promocional Sob Consulta</span>
          </span>
        )}
      </div>

      {/* Title & Badges Header (High Contrast White on Video Background) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1.5 drop-shadow-md">
            <span>{room.type === 'loft' ? 'Loft Família' : 'Suíte Exclusiva'}</span>
            <span>•</span>
            <span className="text-stone-300">Pé na areia em Monte Alto</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] tracking-tight">
            {name}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {room.accepts_pets == 1 ? (
            <span className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-400/30">
              <PawPrint className="w-4 h-4 text-white" />
              <span>Pet Friendly 🐾</span>
            </span>
          ) : (
            <span className="bg-stone-900/80 backdrop-blur-md text-stone-200 text-xs px-3.5 py-2 rounded-full border border-white/15 shadow-md">
              Sem pets
            </span>
          )}

          <span className="bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/15 shadow-md flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Até {room.max_guests} hóspedes</span>
          </span>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="space-y-3">
        <div className="h-[420px] sm:h-[520px] rounded-3xl overflow-hidden bg-stone-900 border border-white/20 shadow-2xl relative">
          <img
            src={activePhoto || photos[0]?.photo_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80'}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {photos.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {photos.map((photo, idx) => {
              const pUrl = photo.photo_url || photo;
              return (
                <button
                  key={photo.id || idx}
                  onClick={() => setActivePhoto(pUrl)}
                  className={`h-20 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                    activePhoto === pUrl
                      ? 'border-amber-500 scale-105 shadow-xl ring-2 ring-amber-400/50'
                      : 'border-white/20 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={pUrl} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content & Reservation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Description & Amenities */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-4">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Sobre a Acomodação
            </h3>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light">
              {description}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              {t('room.amenities')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {amenitiesList.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-stone-900 text-xs font-semibold shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t(`amenities.${amenity}`, { defaultValue: amenity.replace('_', ' ') })}</span>
                </div>
              ))}
            </div>
          </div>

          {room.youtube_video_url && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
                <Video className="w-5 h-5 text-red-500" />
                <span>Tour Virtual em Vídeo</span>
              </h3>
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                <YouTubeEmbed url={room.youtube_video_url} title={`Tour Virtual - ${name}`} />
              </div>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-3 text-xs text-stone-700">
            <h4 className="font-serif font-bold text-stone-900 text-base">
              Políticas da Estadia
            </h4>
            <ul className="space-y-2 list-disc list-inside text-stone-600">
              <li>Check-in a partir das 14:00 | Check-out até as 12:00.</li>
              <li>{room.accepts_pets == 1 ? 'Acomodação Pet Friendly 🐾 (seu companheiro de 4 patas é muito bem-vindo).' : 'Esta acomodação específica não comporta animais de estimação.'}</li>
              <li>Voltagem padrão da região: 110V.</li>
              <li>Cancelamento e alterações flexíveis com aviso prévio.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">
            
            {/* Header with Strikethrough Price + Sob Consulta */}
            <div className="border-b border-stone-200 pb-4">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">
                Tarifa da Acomodação
              </span>
              
              {isPromo ? (
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-stone-400 font-bold text-base">
                      {formatCurrency(room.base_price)} / noite
                    </span>
                    <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Promoção
                    </span>
                  </div>
                  <span className="text-3xl font-serif font-extrabold text-amber-600 block mt-1">
                    Sob Consulta
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    Consulte valores especiais para sua data
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-serif font-bold text-amber-600">
                    {formatCurrency(room.base_price)}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">/ noite</span>
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-stone-700 uppercase block">
                Selecione as Datas Desejadas
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 block font-bold">CHECK-IN</span>
                  <input
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
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

            {/* Estimate Box */}
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>Período da Estadia:</span>
                <span className="font-bold text-stone-900">{nights} diárias</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Taxa de limpeza:</span>
                <span>Inclusa</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex justify-between font-bold text-sm text-stone-900">
                <span>Condição:</span>
                <span className="text-amber-700 font-serif">Desconto Exclusivo</span>
              </div>
            </div>

            {/* Action Buttons: Form Request + WhatsApp Direct */}
            <div className="space-y-3">
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Consultar / Reservar via Formulário</span>
              </button>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar via WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Melhor tarifa garantida sem intermediários
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Booking Form Modal */}
      {isBookingOpen && (
        <BookingModal
          room={room}
          initialDates={{
            check_in: checkIn,
            check_out: checkOut,
            guests: room.max_guests,
            pets: room.accepts_pets == 1
          }}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

    </div>
  );
}
