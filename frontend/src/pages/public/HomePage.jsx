import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Waves, Sun, Heart, ShieldCheck, MapPin, 
  MessageCircle, Star, Sparkles, ArrowRight, 
  ChevronRight, PawPrint, Video, Compass, Award, Calendar, Play, X
} from 'lucide-react';
import AvailabilitySearchBar from '../../components/AvailabilitySearchBar';
import RoomCard from '../../components/RoomCard';
import BookingModal from '../../components/BookingModal';
import VideoTourModal from '../../components/VideoTourModal';
import OceanSoundButton from '../../components/OceanSoundButton';
import SEOHead from '../../components/SEOHead';
import { useVideoBackground } from '../../App';
import { api } from '../../services/api';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { heroMode, setHeroMode } = useVideoBackground();
  
  const [videoTourOpen, setVideoTourOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [searchDates, setSearchDates] = useState({});

  const defaultGallery = [
    { id: 1, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80', title: 'Praia de Monte Alto' },
    { id: 2, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80', title: 'Suíte Master Pé na Areia' },
    { id: 3, image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1000&q=80', title: 'Pôr do Sol na Lagoa de Araruama' },
    { id: 4, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80', title: 'Conforto & Aconchego' },
    { id: 5, image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80', title: 'Loft Familiar Massambaba' },
    { id: 6, image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80', title: 'Área Externa & Jardim Tropical' },
  ];

  useEffect(() => {
    api.getAccommodations(true)
      .then(res => setRooms(res.data || []))
      .catch(err => console.log('Using fallback for accommodations'));

    api.getBlogPosts(true)
      .then(res => setBlogPosts(res.data || []))
      .catch(err => console.log('Using fallback for blog'));

    api.getGallery()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setGalleryItems(res.data);
        } else {
          setGalleryItems(defaultGallery);
        }
      })
      .catch(() => setGalleryItems(defaultGallery));
  }, []);

  const handleSearch = (searchData) => {
    setSearchDates(searchData);
    navigate(`/acomodacoes?check_in=${searchData.check_in}&check_out=${searchData.check_out}&guests=${searchData.guests}&pets=${searchData.pets}`);
  };

  const testimonials = [
    {
      name: 'Mariana & Rodrigo',
      origin: 'Rio de Janeiro, RJ',
      text: 'A experiência em Monte Alto superou todas as expectativas! Ficamos na Suíte Master pé na areia e acordar com o barulho do mar foi mágico. E o melhor: levamos nosso Golden Retriever que foi super bem recebido!',
      stars: 5,
      room: 'Suíte Master Pé na Areia'
    },
    {
      name: 'Família Mendonça',
      origin: 'Belo Horizonte, MG',
      text: 'O Loft Massambaba foi perfeito para nossa família de 4 pessoas. Cozinha completa, churrasqueira e a paz de Monte Alto sem o trânsito do centro. Voltaremos com certeza!',
      stars: 5,
      room: 'Loft Massambaba'
    },
    {
      name: 'Lucas & Beatriz',
      origin: 'São Paulo, SP',
      text: 'O pôr do sol na Lagoa de Araruama a 3 minutos da pousada foi o momento mais inesquecível da viagem. Atendimento nota 10 dos proprietários!',
      stars: 5,
      room: 'Suíte Romântica Sunset'
    }
  ];

  const activeGallery = galleryItems.length > 0 ? galleryItems : defaultGallery;

  return (
    <div className="relative min-h-screen space-y-24 pb-20">
      
      {/* Dynamic SEO Structured Head */}
      <SEOHead
        title="Pé na Areia em Arraial do Cabo - RJ"
        description="Pousada Monte Alto em Arraial do Cabo. Suítes aconchegantes e Lofts familiares pé na areia, pet friendly 🐾, em frente à praia e a 3 min da Lagoa de Araruama."
      />

      {/* 1. HERO SECTION */}
      <section className="relative z-10 min-h-[96vh] flex items-center justify-center text-white pt-28 pb-16 px-4">
        
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Dual Experience Switcher: Real Video Mode Selector */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-stone-900/85 backdrop-blur-md border border-white/20 shadow-2xl">
            <button
              onClick={() => setHeroMode('sea')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                heroMode === 'sea'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-xl scale-105'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>🌊 Vídeo: Ondas Quebrando na Areia</span>
            </button>

            <button
              onClick={() => setHeroMode('sunset')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                heroMode === 'sunset'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 shadow-xl scale-105 font-extrabold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>🌅 Vídeo: Sunset na Lagoa</span>
            </button>
          </div>

          {/* Hero Main Headline */}
          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-2xl">
              {heroMode === 'sea' ? (
                <>
                  Seu refúgio <span className="text-amber-400 italic">pé na areia</span> no paraíso de Arraial do Cabo
                </>
              ) : (
                <>
                  O pôr do sol mais <span className="text-amber-400 italic">mágico e relaxante</span> da Região dos Lagos
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto text-stone-200 text-sm sm:text-base md:text-lg leading-relaxed font-light drop-shadow-md">
              {heroMode === 'sea'
                ? 'Acorde ao som das ondas, caminhe descalço na praia de Monte Alto e viva dias de descanso absoluto com toda a família e seu pet.'
                : 'A apenas 3 minutos da pousada, contemple o espetáculo dourado sobre a Lagoa de Araruama sem o trânsito do centro.'}
            </p>
          </div>

          {/* Sensory Sound & Video Tour Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {/* Ocean Waves Sensory Audio */}
            <OceanSoundButton />

            {/* Video Tour Quick Trigger */}
            <button
              onClick={() => setVideoTourOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 backdrop-blur-md transition-all group shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-2.5 h-2.5 fill-stone-950 ml-0.5" />
              </div>
              <span className="font-semibold text-[11px]">Tour em Vídeo da Pousada (45s)</span>
            </button>
          </div>

          {/* Smart Availability Search Bar */}
          <div className="pt-4">
            <AvailabilitySearchBar onSearch={handleSearch} />
          </div>

          {/* Live Trust Badges & Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-stone-300 font-medium">
            <span className="flex items-center gap-1.5 bg-stone-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Reserva Direta com Melhor Tarifa
            </span>
            <span className="flex items-center gap-1.5 bg-stone-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
              <PawPrint className="w-3.5 h-3.5 text-emerald-400" />
              100% Pet Friendly 🐾
            </span>
            <span className="flex items-center gap-1.5 bg-stone-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              4.9 / 5.0 • Avaliações Reais
            </span>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE MONTE ALTO */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
            O Paraíso de Arraial do Cabo
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            {t('home.whyMonteAlto')}
          </h2>
          <p className="text-stone-300 text-sm max-w-xl mx-auto drop-shadow-sm">
            {t('home.whySub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white/95 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Waves className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              {t('home.benefit1Title')}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {t('home.benefit1Desc')}
            </p>
          </div>

          <div className="bg-white/95 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              {t('home.benefit2Title')}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {t('home.benefit2Desc')}
            </p>
          </div>

          <div className="bg-white/95 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PawPrint className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              {t('home.benefit3Title')}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {t('home.benefit3Desc')}
            </p>
          </div>

          <div className="bg-white/95 p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              {t('home.benefit4Title')}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {t('home.benefit4Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED ACCOMMODATIONS */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
              Conforto & Sofisticação
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mt-1">
              {t('home.featuredRooms')}
            </h2>
            <p className="text-stone-300 text-sm max-w-lg mt-1 drop-shadow-sm">
              {t('home.featuredRoomsSub')}
            </p>
          </div>

          <Link
            to="/acomodacoes"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors drop-shadow-md"
          >
            <span>{t('hero.allAccommodations')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onOpenBooking={(r) => setSelectedRoomForBooking(r)}
            />
          ))}
        </div>
      </section>

      {/* 4. DYNAMIC PHOTO GALLERY */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
            Nossos Espaços
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            {t('home.galleryTitle')}
          </h2>
          <p className="text-stone-300 text-sm drop-shadow-sm">
            {t('home.gallerySub')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activeGallery.map((img) => (
            <div
              key={img.id}
              onClick={() => setLightboxPhoto(img)}
              className="group relative h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl bg-stone-900/60 border border-white/20 cursor-pointer"
            >
              <img
                src={img.image_url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-semibold">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/20">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto.image_url}
              alt={lightboxPhoto.title}
              className="w-full h-full max-h-[75vh] object-contain mx-auto"
            />
            <div className="p-4 bg-stone-950 text-white text-center font-serif font-bold text-base">
              {lightboxPhoto.title}
            </div>
          </div>
        </div>
      )}

      {/* 5. GUEST TESTIMONIALS */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
            Avaliações 5 Estrelas
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            {t('home.testimonialsTitle')}
          </h2>
          <p className="text-stone-300 text-sm">
            {t('home.testimonialsSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="bg-white/95 p-7 rounded-3xl shadow-xl border border-white/40 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed italic">
                  "{test.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <span className="font-serif font-bold text-stone-900 block text-sm">
                  {test.name}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {test.origin} • {test.room}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. BLOG HIGHLIGHTS */}
      {blogPosts.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                Guia Local
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
                {t('home.latestBlogTitle')}
              </h2>
              <p className="text-stone-300 text-sm max-w-lg mt-1">
                {t('home.latestBlogSub')}
              </p>
            </div>

            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Ver Todos os Artigos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.slice(0, 2).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="bg-white/95 rounded-3xl overflow-hidden border border-white/50 shadow-xl hover:shadow-2xl transition-all group flex flex-col sm:flex-row"
              >
                <div className="sm:w-1/2 h-52 sm:h-auto relative overflow-hidden bg-stone-100">
                  <img
                    src={post.featured_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                    alt={post.title_pt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="600"
                  />
                  {post.youtube_video_url && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Video className="w-3 h-3" />
                      Vídeo
                    </span>
                  )}
                </div>
                <div className="p-6 sm:w-1/2 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">
                      Dica de Viagem
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-600 transition-colors mt-1">
                      {post.title_pt}
                    </h3>
                    <p className="text-stone-600 text-xs line-clamp-3 mt-2">
                      {post.excerpt_pt}
                    </p>
                  </div>
                  <span className="text-amber-600 text-xs font-bold flex items-center gap-1 pt-2">
                    Ler artigo <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. BOTTOM CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-8 sm:p-14 shadow-2xl border border-white/20">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest block">
              Melhor Tarifa Garantida
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              {t('home.readyToBookTitle')}
            </h2>
            <p className="text-stone-300 text-sm sm:text-base font-light">
              {t('home.readyToBookSub')}
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <a
                href="https://wa.me/5521969493569?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20valores%20para%20minha%20viagem%20na%20Pousada%20Monte%20Alto."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{t('home.talkOnWhatsApp')}</span>
              </a>

              <Link
                to="/acomodacoes"
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Calendar className="w-5 h-5" />
                <span>Ver Disponibilidade</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          initialDates={searchDates}
          isOpen={!!selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}

      {/* Video Tour Modal */}
      <VideoTourModal
        isOpen={videoTourOpen}
        onClose={() => setVideoTourOpen(false)}
      />

    </div>
  );
}
