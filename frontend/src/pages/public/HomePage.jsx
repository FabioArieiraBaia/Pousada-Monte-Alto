import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Waves, Sun, Heart, ShieldCheck, MapPin, 
  MessageCircle, Star, Sparkles, ArrowRight, 
  ChevronRight, PawPrint, Video, Compass, Award, Calendar
} from 'lucide-react';
import AvailabilitySearchBar from '../../components/AvailabilitySearchBar';
import RoomCard from '../../components/RoomCard';
import BookingModal from '../../components/BookingModal';
import { api } from '../../services/api';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [searchDates, setSearchDates] = useState({});

  useEffect(() => {
    // Load accommodations
    api.getAccommodations(true)
      .then(res => setRooms(res.data || []))
      .catch(err => console.log('Using mock/fallback data for accommodations'));

    // Load blog posts
    api.getBlogPosts(true)
      .then(res => setBlogPosts(res.data || []))
      .catch(err => console.log('Using mock/fallback data for blog'));
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

  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', label: 'Praia de Monte Alto' },
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', label: 'Suíte Master' },
    { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80', label: 'Pôr do Sol na Lagoa' },
    { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', label: 'Conforto & Charme' },
    { url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80', label: 'Loft Familiar' },
    { url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b49?auto=format&fit=crop&w=800&q=80', label: 'Área Externa & Jardim' },
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-stone-950 text-white overflow-hidden pt-24 pb-16 px-4">
        {/* Background Image with Parallax / Blur overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"
            alt="Praia de Monte Alto Arraial do Cabo"
            className="w-full h-full object-cover opacity-50 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sand-50 via-stone-900/60 to-stone-950/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-stone-200 text-sm sm:text-base md:text-lg leading-relaxed font-light">
            {t('hero.subtitle')}
          </p>

          {/* Search Box Component */}
          <div className="pt-6">
            <AvailabilitySearchBar onSearch={handleSearch} />
          </div>

          {/* Quick Highlights underneath */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-stone-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" /> Pé na areia
            </span>
            <span className="flex items-center gap-1.5">
              <PawPrint className="w-4 h-4 text-emerald-400" /> Aceita Pets 🐾
            </span>
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" /> Pôr do Sol na Lagoa
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Reserva Direta Garantida
            </span>
          </div>

        </div>
      </section>

      {/* 2. WHY CHOOSE MONTE ALTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
            O Paraíso de Arraial do Cabo
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            {t('home.whyMonteAlto')}
          </h2>
          <p className="text-stone-600 text-sm max-w-xl mx-auto">
            {t('home.whySub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-stone-200/70 transition-all space-y-3">
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

          <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-stone-200/70 transition-all space-y-3">
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

          <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-stone-200/70 transition-all space-y-3">
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

          <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-stone-200/70 transition-all space-y-3">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
              Conforto & Sofisticação
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
              {t('home.featuredRooms')}
            </h2>
            <p className="text-stone-600 text-sm max-w-lg mt-1">
              {t('home.featuredRoomsSub')}
            </p>
          </div>

          <Link
            to="/acomodacoes"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>{t('hero.allAccommodations')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Accommodations Grid */}
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

      {/* 4. PHOTO GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
            Nossos Espaços
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            {t('home.galleryTitle')}
          </h2>
          <p className="text-stone-600 text-sm">
            {t('home.gallerySub')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group relative h-48 sm:h-64 rounded-3xl overflow-hidden shadow-sm bg-stone-100 cursor-pointer"
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-semibold">{img.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. GUEST TESTIMONIALS */}
      <section className="bg-sand-100/70 py-16 border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
              Avaliações 5 Estrelas
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {t('home.testimonialsTitle')}
            </h2>
            <p className="text-stone-600 text-sm">
              {t('home.testimonialsSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-3xl shadow-sm border border-stone-200/80 space-y-4 flex flex-col justify-between"
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
                  <span className="text-[11px] text-stone-400 block">
                    {test.origin} • {test.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BLOG HIGHLIGHTS */}
      {blogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
                Guia Local
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
                {t('home.latestBlogTitle')}
              </h2>
              <p className="text-stone-600 text-sm max-w-lg mt-1">
                {t('home.latestBlogSub')}
              </p>
            </div>

            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
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
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row"
              >
                <div className="sm:w-1/2 h-52 sm:h-auto relative overflow-hidden bg-stone-100">
                  <img
                    src={post.featured_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                    alt={post.title_pt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
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

      {/* 7. BOTTOM CTA (WHATSAPP & DIRECT BOOKING) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-8 sm:p-14 shadow-2xl">
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

    </div>
  );
}
