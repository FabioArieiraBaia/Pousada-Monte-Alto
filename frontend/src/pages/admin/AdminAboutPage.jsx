import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Save, MapPin, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Waves, Sun, Sparkles, Car, Plane, Globe2, Eye
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAboutPage() {
  const fileInputRef = useRef(null);
  const [activeLang, setActiveLang] = useState('pt'); // 'pt', 'en', 'es'
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state containing all fields for About & Location
  const [form, setForm] = useState({
    // Header
    about_badge_pt: 'Nossa História & Localização',
    about_badge_en: 'Our Story & Location',
    about_badge_es: 'Nuestra Historia y Ubicación',
    about_title_pt: 'Quem Somos & Localização',
    about_title_en: 'About Us & Location',
    about_title_es: 'Quiénes Somos y Ubicación',
    about_subtitle_pt: 'Conheça a Pousada Monte Alto e os encantos do Caribe Brasileiro',
    about_subtitle_en: 'Discover Pousada Monte Alto and the charms of the Brazilian Caribbean',
    about_subtitle_es: 'Conozca la Posada Monte Alto y los encantos del Caribe Brasileño',

    // Story & Concept Card
    about_story_badge_pt: 'Hospitalidade Acolhedora',
    about_story_badge_en: 'Warm Hospitality',
    about_story_badge_es: 'Hospitalidad Acogedora',
    about_story_title_pt: 'Nossa História e Proposta',
    about_story_title_en: 'Our Story & Purpose',
    about_story_title_es: 'Nuestra Historia y Propuesta',
    about_story1_pt: 'A Pousada Monte Alto nasceu do sonho de oferecer uma hospedagem acolhedora, com atendimento familiar e perto da natureza, em um dos pontos mais privilegiados da Região dos Lagos.',
    about_story1_en: 'Pousada Monte Alto was born from the dream of offering cozy lodging with family care and closeness to nature in one of the most privileged locations of Região dos Lagos.',
    about_story1_es: 'La Posada Monte Alto nació del sueño de ofrecer un hospedaje acogedor, con atención familiar y cerca de la naturaleza, en uno de los puntos más privilegiados de la Región de los Lagos.',
    about_story2_pt: 'Situada no charmoso distrito de Monte Alto, na Restinga de Massambaba, nossa localização é um verdadeiro refúgio: pé na areia para o mar e a apenas 3 minutos do pôr do sol na Lagoa de Araruama.',
    about_story2_en: 'Located in the charming district of Monte Alto, within the Massambaba Restinga, our location is a true sanctuary: right on the ocean sand and just 3 minutes from sunset at Lake Araruama.',
    about_story2_es: 'Ubicada en el encantador distrito de Monte Alto, en la Restinga de Massambaba, nuestra ubicación es un verdadero refugio: frente al mar y a solo 3 minutos de la puesta del sol en la Laguna de Araruama.',
    about_benefit1_pt: 'Pé na areia para o oceano',
    about_benefit1_en: 'Right on the ocean beach sand',
    about_benefit1_es: 'A orillas del mar en la arena',
    about_benefit2_pt: 'Pôr do sol na Lagoa a 3 min',
    about_benefit2_en: 'Lake Araruama sunset 3 min away',
    about_benefit2_es: 'Atardecer en la Laguna a 3 min',
    about_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    about_image_caption_pt: '📍 Praia de Monte Alto • Arraial do Cabo - RJ',
    about_image_caption_en: '📍 Monte Alto Beach • Arraial do Cabo - RJ',
    about_image_caption_es: '📍 Playa de Monte Alto • Arraial do Cabo - RJ',

    // Location & Route GPS Section
    loc_badge_pt: 'Fácil Acesso & GPS',
    loc_badge_en: 'Easy Access & GPS',
    loc_badge_es: 'Fácil Acceso y GPS',
    loc_title_pt: 'Como Chegar na Pousada Monte Alto',
    loc_title_en: 'How to Reach Pousada Monte Alto',
    loc_title_es: 'Cómo Llegar a la Posada Monte Alto',
    loc_subtitle_pt: 'Localização privilegiada pé na areia em Monte Alto, com acesso direto pela RJ-102 sem enfrentar os engarrafamentos do centro de Arraial do Cabo.',
    loc_subtitle_en: 'Prime beachfront location in Monte Alto with direct access via RJ-102 without central traffic jams in Arraial do Cabo.',
    loc_subtitle_es: 'Ubicación privilegiada en la playa de Monte Alto, con acceso directo por la RJ-102 sin el tráfico pesado del centro de Arraial do Cabo.',
    loc_address: 'Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ, CEP 28930-000',
    loc_directions_car_pt: 'Pela Ponte Rio-Niterói e Via Lagos (RJ-124), siga pela RJ-102 direto para Monte Alto. Não precisa enfrentar o trânsito do centro de Arraial ou Cabo Frio.',
    loc_directions_car_en: 'Via Rio-Niterói Bridge and Via Lagos (RJ-124), take the RJ-102 directly to Monte Alto. Avoid downtown Arraial or Cabo Frio traffic.',
    loc_directions_car_es: 'Por el Puente Río-Niterói y Via Lagos (RJ-124), continúe por la RJ-102 directo hacia Monte Alto. Sin el tráfico pesado del centro.',
    loc_directions_airport_pt: 'A apenas 10 minutos de carro (8 km) do Aeroporto Internacional de Cabo Frio (CFB) pela rodovia RJ-102.',
    loc_directions_airport_en: 'Only 10 minutes by car (8 km) from Cabo Frio International Airport (CFB) via RJ-102 highway.',
    loc_directions_airport_es: 'A tan solo 10 minutos en auto (8 km) del Aeropuerto Internacional de Cabo Frio (CFB) por la ruta RJ-102.',
    loc_directions_ref_pt: 'Localizada no Distrito de Monte Alto, a poucos passos da faixa de areia do mar e a 3 minutos da orla da Lagoa de Araruama.',
    loc_directions_ref_en: 'Located in Monte Alto, steps from the ocean sand and 3 minutes from Lake Araruama promenade.',
    loc_directions_ref_es: 'Ubicada en Monte Alto, a pasos de la arena del mar y a 3 minutos de la costanera de la Laguna de Araruama.',
    loc_map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14704.281898716805!2d-42.07221295!3d-22.92955895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9717cb49b4b02d%3A0xb3638dbf03b53c15!2sMonte%20Alto%2C%20Arraial%20do%20Cabo%20-%20RJ!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr',

    // Beaches Guide Header
    guide_badge_pt: 'Distâncias & Roteiros',
    guide_badge_en: 'Distances & Itineraries',
    guide_badge_es: 'Distancias y Rutas',
    guide_title_pt: 'Guia de Distâncias & Praias',
    guide_title_en: 'Distances & Beaches Guide',
    guide_title_es: 'Guía de Distancias y Playas',
    guide_sub_pt: 'Descubra as praias mais deslumbrantes da Região dos Lagos com tempos de deslocamento e rotas GPS a partir da Pousada Monte Alto.',
    guide_sub_en: 'Discover the most stunning beaches of Região dos Lagos with driving times and GPS routes from Pousada Monte Alto.',
    guide_sub_es: 'Descubra las playas más deslumbrantes de la Región de los Lagos con tiempos de viaje y rutas GPS desde la Posada Monte Alto.'
  });

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
            ...res.data,
            loc_address: res.data.loc_address || res.data.address || prev.loc_address
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res.url) {
        setForm(prev => ({ ...prev, about_image_url: res.url }));
      }
    } catch (err) {
      alert('Erro no upload da foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updateSettings(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar alterações');
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-amber-600" />
            <span>Editar Página: Quem Somos & Localização</span>
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Edite todos os textos, histórias, comodidades em destaque, fotos e rotas de GPS da página pública.
          </p>
        </div>

        <a 
          href="/sobre-localizacao" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-300 transition-all self-start sm:self-auto"
        >
          <Eye className="w-4 h-4 text-amber-600" />
          <span>Ver Página Pública</span>
        </a>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Alterações salvas com sucesso! A página pública já está atualizada.</span>
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
            SEÇÃO 1: CABEÇALHO DO TOPO DA PÁGINA
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>1. Cabeçalho Principal da Página</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Badge superior, título principal e subtítulo introdutório da página /sobre-localizacao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge Superior ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`about_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Nossa História & Localização"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título Principal ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`about_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Quem Somos & Localização"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Subtítulo / Descrição ({activeLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={form[`about_subtitle_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`about_subtitle_${activeLang}`]: e.target.value })}
              placeholder="Ex: Conheça a Pousada Monte Alto e os encantos do Caribe Brasileiro"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 2: HISTÓRIA & PROPOSTA + FOTO DE DESTAQUE
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Waves className="w-5 h-5 text-amber-600" />
              <span>2. História, Conceito & Foto de Destaque</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Conte a história da pousada, proposta de acolhimento e altere a foto ilustrativa com legenda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge da Seção ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`about_story_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_story_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Hospitalidade Acolhedora"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título do Card ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`about_story_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_story_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Nossa História e Proposta"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Primeiro Parágrafo da História ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              value={form[`about_story1_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`about_story1_${activeLang}`]: e.target.value })}
              placeholder="Conte como surgiu o sonho e a proposta acolhedora da Pousada Monte Alto..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Segundo Parágrafo da História ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              value={form[`about_story2_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`about_story2_${activeLang}`]: e.target.value })}
              placeholder="Descreva a localização privilegiada na Restinga de Massambaba, praia e lagoa..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Destaques de Benefícios (Pílulas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-stone-800 uppercase">
                <Waves className="w-4 h-4 text-amber-600" />
                <span>Pílula Destaque 1 ({activeLang.toUpperCase()})</span>
              </label>
              <input
                type="text"
                value={form[`about_benefit1_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_benefit1_${activeLang}`]: e.target.value })}
                placeholder="Ex: Pé na areia para o oceano"
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none font-bold text-stone-900"
              />
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-stone-800 uppercase">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Pílula Destaque 2 ({activeLang.toUpperCase()})</span>
              </label>
              <input
                type="text"
                value={form[`about_benefit2_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`about_benefit2_${activeLang}`]: e.target.value })}
                placeholder="Ex: Pôr do sol na Lagoa a 3 min"
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none font-bold text-stone-900"
              />
            </div>
          </div>

          {/* Gerenciamento da Foto de Destaque */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>Foto de Destaque do Card</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Preview */}
              <div className="md:col-span-1">
                <div className="relative h-48 rounded-2xl overflow-hidden border border-stone-300 shadow-md bg-stone-100 group">
                  <img
                    src={form.about_image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold">Foto Atual</span>
                  </div>
                </div>
              </div>

              {/* Upload Controls & URL */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Upload de Nova Foto (Computador ou Celular)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploading ? 'Enviando foto...' : 'Escolher Foto do Computador'}</span>
                    </button>
                    {uploading && (
                      <span className="text-xs text-amber-600 font-bold animate-pulse">Fazendo upload...</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Ou URL Direta da Imagem
                  </label>
                  <input
                    type="url"
                    value={form.about_image_url || ''}
                    onChange={(e) => setForm({ ...form, about_image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Legenda da Foto ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={form[`about_image_caption_${activeLang}`] || ''}
                    onChange={(e) => setForm({ ...form, [`about_image_caption_${activeLang}`]: e.target.value })}
                    placeholder="Ex: 📍 Praia de Monte Alto • Arraial do Cabo - RJ"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 3: COMO CHEGAR & GPS (MAPA E ORIENTAÇÕES)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <span>3. Como Chegar & GPS (Seção do Mapa)</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Configure títulos, orientações de carro, aeroporto, ponto de referência e link incorporado do Google Maps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge da Seção ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`loc_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`loc_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Fácil Acesso & GPS"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título Principal ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`loc_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`loc_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Como Chegar na Pousada Monte Alto"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Subtítulo Descritivo ({activeLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={form[`loc_subtitle_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`loc_subtitle_${activeLang}`]: e.target.value })}
              placeholder="Ex: Localização privilegiada pé na areia em Monte Alto..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Endereço Completo para GPS (Compartilhado e Navegação Waze / Maps)
            </label>
            <input
              type="text"
              value={form.loc_address || ''}
              onChange={(e) => setForm({ ...form, loc_address: e.target.value })}
              placeholder="Ex: Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ, CEP 28930-000"
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-medium"
            />
          </div>

          {/* Cards de Orientação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-stone-800 uppercase">
                <Car className="w-4 h-4 text-amber-600" />
                <span>De Carro ({activeLang.toUpperCase()})</span>
              </label>
              <textarea
                rows={4}
                value={form[`loc_directions_car_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`loc_directions_car_${activeLang}`]: e.target.value })}
                placeholder="Instruções para quem vem do Rio pela Ponte Rio-Niterói e Via Lagos..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-stone-800 uppercase">
                <Plane className="w-4 h-4 text-cyan-600" />
                <span>Do Aeroporto ({activeLang.toUpperCase()})</span>
              </label>
              <textarea
                rows={4}
                value={form[`loc_directions_airport_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`loc_directions_airport_${activeLang}`]: e.target.value })}
                placeholder="Instruções de deslocamento a partir do Aeroporto de Cabo Frio..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-stone-800 uppercase">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Ponto de Referência ({activeLang.toUpperCase()})</span>
              </label>
              <textarea
                rows={4}
                value={form[`loc_directions_ref_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`loc_directions_ref_${activeLang}`]: e.target.value })}
                placeholder="Ex: No Distrito de Monte Alto, a poucos passos da praia..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              URL do Mapa Interativo Incorporado (Google Maps Embed iframe src)
            </label>
            <input
              type="text"
              value={form.loc_map_embed_url || ''}
              onChange={(e) => setForm({ ...form, loc_map_embed_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono text-stone-700"
            />
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 4: GUIA DE DISTÂNCIAS & PRAIAS (TÍTULOS)
        ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <span>4. Cabeçalho do Guia de Distâncias & Praias</span>
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Altere os títulos do guia. As praias e atrações individuais são gerenciadas em "Guia de Praias".
              </p>
            </div>
            <a
              href="/admin/praias"
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Ir para Guia de Praias &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Badge do Guia ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`guide_badge_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`guide_badge_${activeLang}`]: e.target.value })}
                placeholder="Ex: Distâncias & Roteiros"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Título do Guia ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={form[`guide_title_${activeLang}`] || ''}
                onChange={(e) => setForm({ ...form, [`guide_title_${activeLang}`]: e.target.value })}
                placeholder="Ex: Guia de Distâncias & Praias"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Subtítulo do Guia ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={2}
              value={form[`guide_sub_${activeLang}`] || ''}
              onChange={(e) => setForm({ ...form, [`guide_sub_${activeLang}`]: e.target.value })}
              placeholder="Descubra as praias mais deslumbrantes da Região dos Lagos com tempos de deslocamento..."
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Action Save Bar Fixed/Bottom */}
        <div className="sticky bottom-6 bg-stone-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-stone-700 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-stone-300 font-medium">
              Edições ativas em <strong>{activeLang.toUpperCase()}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 fill-stone-950" />
            <span>{saving ? 'Salvando Alterações...' : 'Salvar Todas as Informações'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
