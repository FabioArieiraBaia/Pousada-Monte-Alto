import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Compass, Anchor, Waves, Sun, Clock, Users, ShieldCheck, 
  Sparkles, CheckCircle2, ArrowRight, Star, Video, MessageCircle
} from 'lucide-react';
import { api } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import ServiceBookingModal from '../../components/ServiceBookingModal';

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.getServices(true);
      setServices(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: 'Todos os Passeios', icon: Compass },
    { key: 'barco', label: 'Passeios de Barco', icon: Anchor },
    { key: 'mergulho', label: 'Mergulho & Snorkel', icon: Waves },
    { key: 'buggy', label: 'Buggy & 4x4', icon: Sun },
  ];

  const filteredServices = categoryFilter === 'all'
    ? services
    : services.filter(s => s.category === categoryFilter);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const getLocalizedName = (s) => {
    if (i18n.language.startsWith('en') && s.name_en) return s.name_en;
    if (i18n.language.startsWith('es') && s.name_es) return s.name_es;
    return s.name_pt;
  };

  const getLocalizedTagline = (s) => {
    if (i18n.language.startsWith('en') && s.tagline_en) return s.tagline_en;
    if (i18n.language.startsWith('es') && s.tagline_es) return s.tagline_es;
    return s.tagline_pt || '';
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEOHead
        title="Passeios & Experiências em Arraial do Cabo | Pousada Monte Alto"
        description="Viva as melhores experiências do Caribe Brasileiro: passeios de barco pelas Prainhas e Ilha do Farol, mergulho de batismo na Capital do Mergulho e passeios de buggy pelas dunas."
        image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Experiências & Roteiros Exclusivos</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
          Passeios & Experiências
        </h1>
        <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
          Descubra o melhor de Arraial do Cabo com parceiros selecionados a dedo pela <strong>Pousada Monte Alto</strong>. Agende com facilidade e viva momentos inesquecíveis entre o mar, as dunas e a lagoa.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = categoryFilter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-stone-900/60 rounded-3xl h-96 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/40 rounded-3xl border border-stone-800/80 p-8 max-w-lg mx-auto">
          <Compass className="w-12 h-12 text-stone-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Nenhum passeio nesta categoria</h3>
          <p className="text-stone-400 text-sm mt-1">
            Selecione outra categoria ou entre em contato direto conosco para opções personalizadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-stone-900/80 rounded-3xl overflow-hidden border border-stone-800/80 hover:border-amber-500/40 transition-all duration-300 flex flex-col group hover:-translate-y-1 shadow-xl backdrop-blur-sm"
            >
              {/* Cover Photo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={service.cover_photo}
                  alt={service.name_pt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />

                {/* Badges */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="bg-stone-950/80 backdrop-blur-md text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{service.duration_label || 'Consulte'}</span>
                  </span>

                  {service.is_featured === 1 && (
                    <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      Destaque
                    </span>
                  )}
                </div>

                {service.youtube_video_url && (
                  <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-stone-950/70 backdrop-blur-md flex items-center justify-center text-red-400 border border-red-500/20">
                    <Video className="w-4 h-4" />
                  </div>
                )}

                <div className="absolute bottom-3.5 left-3.5 right-3.5">
                  <span className="text-[11px] text-amber-300 font-semibold block uppercase tracking-wider">
                    {service.category === 'barco' ? 'Passeio Náutico' : service.category === 'mergulho' ? 'Mergulho Subaquático' : service.category === 'buggy' ? 'Aventura 4x4' : 'Experiência'}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white leading-snug truncate">
                    {getLocalizedName(service)}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed">
                  {getLocalizedTagline(service) || service.description_pt}
                </p>

                {/* Highlights / Inclusos */}
                {service.included_items && service.included_items.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                    {service.included_items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-stone-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price & Action */}
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Por pessoa</span>
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(service.price_per_person)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/servicos/${service.slug}`}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Detalhes
                    </Link>

                    <button
                      onClick={() => setSelectedServiceForBooking(service)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                    >
                      <span>Reservar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedServiceForBooking && (
        <ServiceBookingModal
          service={selectedServiceForBooking}
          isOpen={!!selectedServiceForBooking}
          onClose={() => setSelectedServiceForBooking(null)}
        />
      )}
    </div>
  );
}
