import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Video, 
  Check, X, Sparkles, Play, Globe, ExternalLink, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import SocialVideoEmbed from '../../components/SocialVideoEmbed';
import { InstagramIcon } from '../../components/SocialIcons';

export default function AdminVideoGalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    video_url: '',
    video_type: 'youtube',
    category: 'pousada',
    order_index: 0
  });

  const categories = [
    { key: 'pousada', label: 'A Pousada & Estrutura' },
    { key: 'experiencias', label: 'Passeios & Experiências' },
    { key: 'praia', label: 'Praias de Arraial do Cabo' },
    { key: 'lagoa', label: 'Lagoa de Araruama & Sunset' },
    { key: 'reels', label: 'Reels & Momentos dos Hóspedes' }
  ];

  const getCategoryLabel = (catKey) => {
    const key = (catKey || '').toLowerCase();
    return categories.find(c => c.key === key)?.label || catKey || 'Geral';
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    setLoading(true);
    api.getVideoGallery()
      .then(res => setItems(res.data || []))
      .catch(err => {
        console.error('Erro ao carregar vídeos:', err);
        // Fallback default demo videos
        setItems([
          {
            id: 1,
            title: 'Tour Virtual Completo pela Pousada',
            video_url: 'https://www.youtube.com/watch?v=0kH8s4Ue7w8',
            video_type: 'youtube',
            category: 'pousada',
            order_index: 1
          },
          {
            id: 2,
            title: 'Pôr do Sol Dourado na Lagoa de Araruama',
            video_url: 'https://www.youtube.com/shorts/3X9vV3sK4pE',
            video_type: 'shorts',
            category: 'lagoa',
            order_index: 2
          },
          {
            id: 3,
            title: 'Praia de Monte Alto - Pé na Areia & Drone',
            video_url: 'https://www.instagram.com/reel/C8qL0PkuXYZ/',
            video_type: 'reels',
            category: 'praia',
            order_index: 3
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  const detectVideoType = (url) => {
    const clean = (url || '').trim().toLowerCase();
    if (clean.includes('instagram.com')) {
      return clean.includes('/reel') ? 'reels' : 'instagram';
    }
    if (clean.includes('/shorts/')) {
      return 'shorts';
    }
    return 'youtube';
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        id: item.id,
        title: item.title,
        video_url: item.video_url,
        video_type: item.video_type || detectVideoType(item.video_url),
        category: item.category || 'pousada',
        order_index: item.order_index || 0
      });
    } else {
      setEditingItem(null);
      setForm({
        title: '',
        video_url: '',
        video_type: 'youtube',
        category: 'pousada',
        order_index: items.length + 1
      });
    }
    setModalOpen(true);
  };

  const handleUrlChange = (newUrl) => {
    const detected = detectVideoType(newUrl);
    setForm(prev => ({
      ...prev,
      video_url: newUrl,
      video_type: detected
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.video_url) {
      alert('Por favor, informe o link do vídeo (YouTube ou Instagram).');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await api.updateVideoGalleryItem(form.id, form);
      } else {
        await api.createVideoGalleryItem(form);
      }
      setModalOpen(false);
      loadVideos();
    } catch (err) {
      alert(err.message || 'Erro ao salvar vídeo na galeria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Tem certeza que deseja remover o vídeo "${title}" da galeria?`)) {
      try {
        await api.deleteVideoGalleryItem(id);
        loadVideos();
      } catch (err) {
        alert(err.message || 'Erro ao remover vídeo');
      }
    }
  };

  const isInstagramUrl = (url) => (url || '').toLowerCase().includes('instagram.com');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-amber-600" />
            <span>Galeria de Vídeos & Reels</span>
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Gerencie os vídeos do YouTube (padrão e Shorts) e do Instagram (Reels e Posts) que aparecem abaixo da galeria de fotos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-5 py-3.5 rounded-2xl shadow-sm transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Novo Vídeo</span>
        </button>
      </div>

      {/* Guide Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-stone-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Suporte Multimídia Completo:</strong> Aceita links do <strong>YouTube</strong> (vídeos normais, Shorts e lives) e do <strong>Instagram</strong> (Reels e Posts).
          </span>
        </div>
        <span className="text-[11px] font-semibold text-stone-600 bg-white/80 px-3 py-1 rounded-full border border-stone-200/60 shrink-0 self-start sm:self-auto">
          {items.length} {items.length === 1 ? 'vídeo cadastrado' : 'vídeos cadastrados'}
        </span>
      </div>

      {/* Video Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-72 bg-stone-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isIg = isInstagramUrl(item.video_url);
            const isShort = (item.video_url || '').toLowerCase().includes('/shorts/');
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Embed or Preview Card */}
                <div className="p-3 bg-stone-950">
                  <SocialVideoEmbed 
                    url={item.video_url} 
                    title={item.title} 
                  />
                </div>

                {/* Video Info & Controls */}
                <div className="p-5 flex flex-col justify-between flex-1 bg-white space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {getCategoryLabel(item.category)}
                      </span>

                      {isIg ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <InstagramIcon className="w-3 h-3" /> Instagram
                        </span>
                      ) : isShort ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Shorts
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Play className="w-3 h-3 fill-red-600" /> YouTube
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-bold text-base text-stone-900 leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    <span className="text-[11px] text-stone-400 block truncate font-mono">
                      {item.video_url}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-[11px]">
                      Ordem: #{item.order_index}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        title="Editar Vídeo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir Vídeo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 space-y-3">
          <Video className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            Nenhum vídeo cadastrado na galeria
          </h3>
          <p className="text-stone-500 text-xs">
            Clique no botão acima para adicionar vídeos do YouTube ou Reels do Instagram.
          </p>
        </div>
      )}

      {/* Modal CRUD Video */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-100 my-8 animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingItem ? 'Editar Vídeo da Galeria' : 'Novo Vídeo da Galeria'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {form.title || 'Vídeo do YouTube ou Instagram'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-stone-800 text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* Video URL */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Link do Vídeo (YouTube ou Instagram) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.video_url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/... "
                    className="w-full text-xs p-3 pl-10 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                  <div className="absolute left-3 top-3 text-stone-400">
                    <Play className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                  <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    Cole links normais do YouTube, <strong>Shorts</strong> verticais ou links de <strong>Reels</strong> e Posts do Instagram.
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Título / Legenda do Vídeo *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Pousada Monte Alto - Tour pelas Suítes e Dunas"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              {/* Category & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-bold"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-2">
                  Pré-visualização do Vídeo:
                </label>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <SocialVideoEmbed 
                    url={form.video_url} 
                    title={form.title || 'Vídeo da Galeria'} 
                    isPreview={true} 
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Vídeo</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
