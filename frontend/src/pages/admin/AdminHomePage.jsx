import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Save, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Waves, Sun, Sparkles, 
  Globe2, Eye, Star, MessageSquare, Plus, Trash2,
  PawPrint, Compass, ShieldCheck, Play, Video
} from 'lucide-react';
import { api } from '../../services/api';
import SocialVideoEmbed from '../../components/SocialVideoEmbed';

export default function AdminHomePage() {
  const [activeLang, setActiveLang] = useState('pt'); // 'pt', 'en', 'es'
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultTestimonials = [
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

  const [form, setForm] = useState({
    // Hero Sea Mode
    home_hero_sea_title_pt: 'Seu refúgio pé na areia no paraíso de Arraial do Cabo',
    home_hero_sea_title_en: 'Your beachfront haven in the paradise of Arraial do Cabo',
    home_hero_sea_title_es: 'Su refugio frente al mar en el paraíso de Arraial do Cabo',
    home_hero_sea_sub_pt: 'Acorde ao som das ondas, caminhe descalço na praia de Monte Alto e viva dias de descanso absoluto com toda a família e seu pet.',
    home_hero_sea_sub_en: 'Wake up to the sound of waves, walk barefoot on Monte Alto beach and experience total relaxation with your family and pet.',
    home_hero_sea_sub_es: 'Despierte con el sonido de las olas, camine descalzo por la playa de Monte Alto y viva días de descanso absoluto con su familia y mascota.',

    // Hero Sunset Mode
    home_hero_sunset_title_pt: 'O pôr do sol mais mágico e relaxante da Região dos Lagos',
    home_hero_sunset_title_en: 'The most magical and relaxing sunset in the Lakes Region',
    home_hero_sunset_title_es: 'El atardecer más mágico y relajante de la Región de los Lagos',
    home_hero_sunset_sub_pt: 'A apenas 3 minutos da pousada, contemple o espetáculo dourado sobre a Lagoa de Araruama sem o trânsito do centro.',
    home_hero_sunset_sub_en: 'Just 3 minutes from the inn, enjoy the golden spectacle over Lake Araruama away from downtown traffic.',
    home_hero_sunset_sub_es: 'A solo 3 minutos de la posada, contemple el espectáculo dorado sobre la Laguna de Araruama sin el tráfico del centro.',

    // Why Choose Monte Alto Header
    home_why_badge_pt: 'O Paraíso de Arraial do Cabo',
    home_why_badge_en: 'The Paradise of Arraial do Cabo',
    home_why_badge_es: 'El Paraíso de Arraial do Cabo',
    home_why_title_pt: 'Por que Escolher Monte Alto?',
    home_why_title_en: 'Why Choose Monte Alto?',
    home_why_title_es: '¿Por qué Elegir Monte Alto?',
    home_why_sub_pt: 'A combinação única de paz e contato com a natureza na Região dos Lagos.',
    home_why_sub_en: 'The unique combination of tranquility and nature in the Lakes Region.',
    home_why_sub_es: 'La combinación perfecta de paz y naturaleza en la Región de los Lagos.',

    // Benefit 1: Pé na Areia
    home_b1_title_pt: 'Pé na Areia Sem Aglomerações',
    home_b1_title_en: 'Peaceful Beachfront',
    home_b1_title_es: 'Frente al Mar Sin Multitudes',
    home_b1_desc_pt: 'Praia de águas limpas e areia clara na porta da pousada, longe do barulho da cidade.',
    home_b1_desc_en: 'Clean waters and white sand right at our doorstep, away from city crowds.',
    home_b1_desc_es: 'Playa de aguas limpias y arena blanca frente a la posada, lejos del bullicio de la ciudad.',
    home_b1_image: '',

    // Benefit 2: Pôr do Sol
    home_b2_title_pt: 'Pôr do Sol Mágico na Lagoa',
    home_b2_title_en: 'Magical Lagoon Sunset',
    home_b2_title_es: 'Atardecer Mágico en la Laguna',
    home_b2_desc_pt: 'A apenas 3 minutos da Lagoa de Araruama com o espetáculo do pôr do sol mais bonito da região.',
    home_b2_desc_en: 'Just 3 minutes from Araruama Lagoon with the most stunning sunset in the region.',
    home_b2_desc_es: 'A solo 3 minutos de la Laguna de Araruama con la puesta de sol más bella de la región.',
    home_b2_image: '',

    // Benefit 3: Pet Friendly
    home_b3_title_pt: 'Pousada Pet Friendly 🐾',
    home_b3_title_en: 'Pet Friendly Pousada 🐾',
    home_b3_title_es: 'Posada Pet Friendly 🐾',
    home_b3_desc_pt: 'Seu companheiro de quatro patas é muito bem-vindo nas nossas suítes e bangalôs equipados.',
    home_b3_desc_en: 'Your four-legged best friend is warmly welcome in our pet-ready suites and lofts.',
    home_b3_desc_es: 'Su fiel compañero de cuatro patas es muy bienvenido en nuestras suites y lofts equipados.',
    home_b3_image: '/images/benefits/pet_friendly_pousada.png',

    // Benefit 4: Perto de Tudo
    home_b4_title_pt: 'Perto de Tudo em Arraial',
    home_b4_title_en: 'Close to Everything',
    home_b4_title_es: 'Cerca de Todo en Arraial',
    home_b4_desc_pt: 'A 15 minutos dos passeios de barco na Praia dos Anjos, Prainhas do Pontal e Praia do Forno.',
    home_b4_desc_en: '15 minutes to boat tours at Anjos Beach, Pontal do Atalaia and Forno Beach.',
    home_b4_desc_es: 'A 15 minutos de los paseos en barco en Praia dos Anjos, Pontal do Atalaia y Praia do Forno.',
    home_b4_image: '',

    // Testimonials Header
    home_test_badge_pt: 'Avaliações 5 Estrelas',
    home_test_badge_en: '5-Star Reviews',
    home_test_badge_es: 'Opiniones 5 Estrellas',
    home_test_title_pt: 'O que Nossos Hóspedes Dizem',
    home_test_title_en: 'What Our Guests Say',
    home_test_title_es: 'Lo que Dicen Nuestros Huéspedes',
    home_test_sub_pt: 'Histórias de quem já viveu a experiência Pousada Monte Alto.',
    home_test_sub_en: 'Real reviews from travelers who loved Pousada Monte Alto.',
    home_test_sub_es: 'Opiniones reales de viajeros que disfrutaron de Pousada Monte Alto.',

    // Video Highlight Section (Instagram or YouTube)
    home_video_section_title_pt: 'Conheça o Paraíso em Vídeo',
    home_video_section_title_en: 'Discover Paradise in Video',
    home_video_section_title_es: 'Conozca el Paraíso en Video',
    home_video_section_desc_pt: 'Assista aos nossos melhores momentos em Monte Alto, entre o mar e a Lagoa de Araruama.',
    home_video_section_desc_en: 'Watch our finest moments in Monte Alto, between the sea and Araruama Lagoon.',
    home_video_section_desc_es: 'Mire nuestros mejores momentos en Monte Alto, entre el mar y la Laguna de Araruama.',
    home_video_section_url: '',

    // CTA Bottom Section
    home_cta_badge_pt: 'Melhor Tarifa Garantida',
    home_cta_badge_en: 'Best Rate Guaranteed',
    home_cta_badge_es: 'Mejor Tarifa Garantizada',
    home_cta_title_pt: 'Pronto para viver essa experiência?',
    home_cta_title_en: 'Ready for your beach getaway?',
    home_cta_title_es: '¿Listo para vivir esta experiencia?',
    home_cta_sub_pt: 'Garanta a melhor tarifa reservando diretamente conosco via WhatsApp ou online.',
    home_cta_sub_en: 'Get the best rate by booking directly with us via WhatsApp or online.',
    home_cta_sub_es: 'Obtenga la mejor tarifa reservando directamente con nosotros por WhatsApp o en línea.',
    home_cta_whatsapp_text_pt: 'Falar pelo WhatsApp',
    home_cta_whatsapp_text_en: 'Chat on WhatsApp',
    home_cta_whatsapp_text_es: 'Hablar por WhatsApp'
  });

  const [testimonials, setTestimonials] = useState(defaultTestimonials);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    api.getSettings()
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          setForm(prev => ({
            ...prev,
            ...res.data
          }));
          if (res.data.home_testimonials) {
            try {
              const parsed = typeof res.data.home_testimonials === 'string'
                ? JSON.parse(res.data.home_testimonials)
                : res.data.home_testimonials;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTestimonials(parsed);
              }
            } catch (e) {
              console.warn('Erro ao decodificar depoimentos salvos:', e);
            }
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUploadBenefitImage = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const res = await api.uploadImage(file);
      if (res.url) {
        setForm(prev => ({ ...prev, [field]: res.url }));
      }
    } catch (err) {
      alert('Erro ao enviar imagem: ' + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddTestimonial = () => {
    setTestimonials(prev => [
      ...prev,
      {
        name: 'Novo Hóspede',
        origin: 'Cidade, Estado',
        text: 'Escreva aqui o depoimento ou avaliação do hóspede...',
        stars: 5,
        room: 'Suíte / Loft'
      }
    ]);
  };

  const handleUpdateTestimonial = (index, field, value) => {
    setTestimonials(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveTestimonial = (index) => {
    if (confirm('Deseja realmente remover este depoimento?')) {
      setTestimonials(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        ...form,
        home_testimonials: JSON.stringify(testimonials)
      };
      await api.updateSettings(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar alterações da Página Inicial');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-stone-400">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <Home className="w-7 h-7 text-amber-600" />
            <span>Editar Página Inicial (Home)</span>
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Personalize os títulos do topo (mar & pôr do sol), os 4 cards de benefícios, depoimentos reais e chamadas de reserva.
          </p>
        </div>

        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Ver Site Público</span>
        </a>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Página Inicial atualizada com sucesso! Todas as mudanças já estão visíveis no site público.</span>
        </div>
      )}

      {/* Language Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-stone-700 text-xs font-bold">
          <Globe2 className="w-4 h-4 text-amber-600" />
          <span>Idioma dos Textos para Edição:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveLang('pt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeLang === 'pt'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>🇧🇷 Português (PT)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeLang === 'en'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>🇺🇸 Inglês (EN)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('es')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeLang === 'es'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>🇪🇸 Espanhol (ES)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ========================================================
            SEÇÃO 1: HERO PRINCIPAL (MODO MAR & MODO PÔR DO SOL)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>1. Topo da Página (Hero Headlines)</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Personalize os títulos e subtítulos que o visitante visualiza no topo do site para cada modo de vídeo de fundo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modo Mar */}
            <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 space-y-4">
              <div className="flex items-center gap-2 text-cyan-900 font-bold text-sm">
                <Waves className="w-4 h-4 text-cyan-600" />
                <span>Modo 1: Ondas do Mar / Pé na Areia</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Título Principal ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={form[`home_hero_sea_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_hero_sea_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Seu refúgio pé na areia no paraíso de Arraial do Cabo"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-cyan-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Subtítulo ({activeLang.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={form[`home_hero_sea_sub_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_hero_sea_sub_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Acorde ao som das ondas, caminhe descalço na praia..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-cyan-500 bg-white"
                />
              </div>
            </div>

            {/* Modo Sunset */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Modo 2: Pôr do Sol na Lagoa</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Título Principal ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={form[`home_hero_sunset_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_hero_sunset_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: O pôr do sol mais mágico e relaxante da Região dos Lagos"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Subtítulo ({activeLang.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={form[`home_hero_sunset_sub_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_hero_sunset_sub_${activeLang}`]: e.target.value })}
                  placeholder="Ex: A apenas 3 minutos da pousada, contemple o espetáculo dourado..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 2: OS 4 BENEFÍCIOS (POR QUE ESCOLHER MONTE ALTO)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <span>2. Seção "Por que Escolher Monte Alto?"</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Edite o cabeçalho e os 4 cards de diferenciais que apresentam os pontos fortes da pousada.
            </p>
          </div>

          {/* Cabeçalho da Seção */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-stone-100">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge Superior ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_why_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_why_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: O Paraíso de Arraial do Cabo"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título da Seção ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_why_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_why_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Por que Escolher Monte Alto?"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Subtítulo ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_why_sub_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_why_sub_${activeLang}`]: e.target.value })}
                placeholder="Ex: A combinação única de paz e contato com a natureza..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Cards dos 4 Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-amber-600 uppercase">Card 1: Pé na Areia</span>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Título ({activeLang.toUpperCase()})</label>
                <input
                  type="text"
                  value={form[`home_b1_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b1_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Pé na Areia Sem Aglomerações"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Descrição ({activeLang.toUpperCase()})</label>
                <textarea
                  rows={2}
                  value={form[`home_b1_desc_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b1_desc_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Praia de águas limpas e areia clara na porta..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Foto Personalizada (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.home_b1_image || ''}
                    onChange={(e) => setForm({ ...form, home_b1_image: e.target.value })}
                    placeholder="URL da foto ou envie um arquivo ao lado"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                  <label className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'home_b1_image' ? 'Enviando...' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadBenefitImage('home_b1_image', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-amber-600 uppercase">Card 2: Pôr do Sol na Lagoa</span>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Título ({activeLang.toUpperCase()})</label>
                <input
                  type="text"
                  value={form[`home_b2_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b2_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Pôr do Sol Mágico na Lagoa"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Descrição ({activeLang.toUpperCase()})</label>
                <textarea
                  rows={2}
                  value={form[`home_b2_desc_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b2_desc_${activeLang}`]: e.target.value })}
                  placeholder="Ex: A apenas 3 minutos da Lagoa de Araruama..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Foto Personalizada (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.home_b2_image || ''}
                    onChange={(e) => setForm({ ...form, home_b2_image: e.target.value })}
                    placeholder="URL da foto ou envie um arquivo ao lado"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                  <label className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'home_b2_image' ? 'Enviando...' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadBenefitImage('home_b2_image', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-amber-600 uppercase">Card 3: Pet Friendly</span>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Título ({activeLang.toUpperCase()})</label>
                <input
                  type="text"
                  value={form[`home_b3_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b3_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Pousada Pet Friendly 🐾"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Descrição ({activeLang.toUpperCase()})</label>
                <textarea
                  rows={2}
                  value={form[`home_b3_desc_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b3_desc_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Seu companheiro de quatro patas é muito bem-vindo..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Foto Personalizada (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.home_b3_image || ''}
                    onChange={(e) => setForm({ ...form, home_b3_image: e.target.value })}
                    placeholder="URL da foto ou envie um arquivo ao lado"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                  <label className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'home_b3_image' ? 'Enviando...' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadBenefitImage('home_b3_image', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-amber-600 uppercase">Card 4: Perto de Tudo</span>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Título ({activeLang.toUpperCase()})</label>
                <input
                  type="text"
                  value={form[`home_b4_title_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b4_title_${activeLang}`]: e.target.value })}
                  placeholder="Ex: Perto de Tudo em Arraial"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Descrição ({activeLang.toUpperCase()})</label>
                <textarea
                  rows={2}
                  value={form[`home_b4_desc_${activeLang}`] || ''}
                  onChange={(e) => setForm({ ...form, [`home_b4_desc_${activeLang}`]: e.target.value })}
                  placeholder="Ex: A 15 minutos dos passeios de barco..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Foto Personalizada (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.home_b4_image || ''}
                    onChange={(e) => setForm({ ...form, home_b4_image: e.target.value })}
                    placeholder="URL da foto ou envie um arquivo ao lado"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                  <label className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'home_b4_image' ? 'Enviando...' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadBenefitImage('home_b4_image', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            SEÇÃO 3: DEPOIMENTOS DE HÓSPEDES
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>3. Depoimentos e Avaliações de Hóspedes</span>
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Adicione, edite ou remova avaliações que transmitem confiança aos novos visitantes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTestimonial}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Depoimento</span>
            </button>
          </div>

          {/* Cabeçalho da Seção de Depoimentos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-stone-100">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_test_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_test_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Avaliações 5 Estrelas"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_test_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_test_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: O que Nossos Hóspedes Dizem"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Subtítulo ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_test_sub_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_test_sub_${activeLang}`]: e.target.value })}
                placeholder="Ex: Histórias de quem já viveu a experiência..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Lista de Depoimentos */}
          <div className="space-y-4">
            {testimonials.map((test, index) => (
              <div 
                key={index} 
                className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 relative space-y-3 group hover:border-amber-400 transition-all"
              >
                <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-xs font-bold text-stone-700">Depoimento #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestimonial(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remover Depoimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Nome do Hóspede</label>
                    <input
                      type="text"
                      value={test.name || ''}
                      onChange={(e) => handleUpdateTestimonial(index, 'name', e.target.value)}
                      placeholder="Ex: Mariana & Rodrigo"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Origem / Cidade</label>
                    <input
                      type="text"
                      value={test.origin || ''}
                      onChange={(e) => handleUpdateTestimonial(index, 'origin', e.target.value)}
                      placeholder="Ex: Rio de Janeiro, RJ"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Acomodação Ficada / Estrelas</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={test.room || ''}
                        onChange={(e) => handleUpdateTestimonial(index, 'room', e.target.value)}
                        placeholder="Ex: Suíte Master Pé na Areia"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                      />
                      <select
                        value={test.stars || 5}
                        onChange={(e) => handleUpdateTestimonial(index, 'stars', Number(e.target.value))}
                        className="text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-bold shrink-0"
                      >
                        <option value="5">5 ⭐</option>
                        <option value="4">4 ⭐</option>
                        <option value="3">3 ⭐</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Texto da Avaliação</label>
                  <textarea
                    rows={2}
                    value={test.text || ''}
                    onChange={(e) => handleUpdateTestimonial(index, 'text', e.target.value)}
                    placeholder="Ex: A experiência em Monte Alto superou todas as expectativas..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white italic"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 4: VÍDEO EM DESTAQUE (INSTAGRAM OU YOUTUBE)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-600" />
                <span>4. Sessão de Vídeo em Destaque (Instagram ou YouTube)</span>
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Exibida abaixo dos depoimentos. Suporta links de Reels ou Posts do Instagram e vídeos ou Shorts do YouTube.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Suporta Instagram & YouTube
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Link do Vídeo (Instagram ou YouTube)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.home_video_section_url || ''}
                  onChange={(e) => setForm({ ...form, home_video_section_url: e.target.value })}
                  placeholder="Ex: https://www.instagram.com/reel/C... ou https://www.youtube.com/watch?v=..."
                  className="w-full text-xs p-3 pl-10 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-mono"
                />
                <div className="absolute left-3 top-3 text-stone-400">
                  <Play className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                💡 <strong>Formatos aceitos:</strong> Reels do Instagram (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">instagram.com/reel/...</code> ou <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">instagram.com/p/...</code>) ou vídeos do YouTube (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">youtube.com/watch?v=...</code>, Shorts ou <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">youtu.be/...</code>). Se deixar em branco, a seção não será exibida no site.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título da Sessão ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_video_section_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_video_section_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Conheça o Paraíso em Vídeo"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Descrição da Sessão ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={2}
                value={form[`home_video_section_desc_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_video_section_desc_${activeLang}`]: e.target.value })}
                placeholder="Ex: Assista aos nossos melhores momentos em Monte Alto, entre o mar e a Lagoa de Araruama..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Preview do Vídeo */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-stone-500 uppercase mb-2">
                Pré-visualização do Vídeo:
              </label>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <SocialVideoEmbed 
                  url={form.home_video_section_url} 
                  title={form[`home_video_section_title_${activeLang}`] || 'Vídeo em Destaque'} 
                  isPreview={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 5: CTA FINAL (BANNER PRÉ-RODAPÉ)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>5. Chamada de Fechamento (Banner de Reserva Pré-Rodapé)</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Edite o banner convidativo exibido no fim da página inicial antes do rodapé.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_cta_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_cta_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Melhor Tarifa Garantida"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Texto do Botão WhatsApp ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`home_cta_whatsapp_text_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`home_cta_whatsapp_text_${activeLang}`]: e.target.value })}
                placeholder="Ex: Falar pelo WhatsApp"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Título Principal ({activeLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={form[`home_cta_title_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`home_cta_title_${activeLang}`]: e.target.value })}
              placeholder="Ex: Pronto para viver essa experiência?"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Subtítulo ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={2}
              value={form[`home_cta_sub_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`home_cta_sub_${activeLang}`]: e.target.value })}
              placeholder="Ex: Garanta a melhor tarifa reservando diretamente conosco..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Botão de Salvar Fixo / Final */}
        <div className="sticky bottom-6 z-20 bg-stone-900/90 backdrop-blur-md p-4 rounded-2xl border border-stone-700 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Salva e atualiza o index público instantaneamente em PT, EN e ES.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Página Inicial'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
