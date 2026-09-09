import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, MapPin, Clock, Video, 
  Upload, Check, X, Compass, ExternalLink, Loader2, Sparkles, Eye
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { api } from '../../services/api';

export default function AdminAttractionsPage() {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const initialForm = {
    name_pt: '',
    name_en: '',
    name_es: '',
    distance_label_pt: '',
    distance_label_en: '',
    distance_label_es: '',
    duration_badge_pt: '',
    duration_badge_en: '',
    duration_badge_es: '',
    description_pt: '',
    description_en: '',
    description_es: '',
    tips_pt: '',
    tips_en: '',
    tips_es: '',
    image_url: '',
    youtube_video_url: '',
    maps_url: '',
    order_index: 0,
    is_active: 1
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadAttractions();
  }, []);

  const loadAttractions = () => {
    setLoading(true);
    api.getAttractions(true)
      .then(res => setAttractions(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        id: item.id,
        name_pt: item.name_pt || '',
        name_en: item.name_en || item.name_pt || '',
        name_es: item.name_es || item.name_pt || '',
        distance_label_pt: item.distance_label_pt || '',
        distance_label_en: item.distance_label_en || '',
        distance_label_es: item.distance_label_es || '',
        duration_badge_pt: item.duration_badge_pt || '',
        duration_badge_en: item.duration_badge_en || '',
        duration_badge_es: item.duration_badge_es || '',
        description_pt: item.description_pt || '',
        description_en: item.description_en || '',
        description_es: item.description_es || '',
        tips_pt: item.tips_pt || '',
        tips_en: item.tips_en || '',
        tips_es: item.tips_es || '',
        image_url: item.image_url || '',
        youtube_video_url: item.youtube_video_url || '',
        maps_url: item.maps_url || '',
        order_index: item.order_index || 0,
        is_active: item.is_active !== undefined ? Number(item.is_active) : 1
      });
    } else {
      setEditingItem(null);
      setForm({
        ...initialForm,
        order_index: attractions.length + 1
      });
    }
    setUploading(false);
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      const url = res.url || res.file_url;
      if (url) {
        setForm(prev => ({ ...prev, image_url: url }));
      }
    } catch (err) {
      alert('Erro no upload: ' + (err.message || 'Falha ao enviar imagem'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name_pt.trim()) {
      alert('O nome em português é obrigatório.');
      return;
    }
    if (!form.image_url.trim()) {
      alert('Adicione uma foto para a praia (upload ou URL).');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await api.updateAttraction(form.id, form);
      } else {
        await api.createAttraction(form);
      }
      setModalOpen(false);
      loadAttractions();
    } catch (err) {
      alert('Erro ao salvar praia: ' + (err.message || 'Falha no salvamento'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}" do Guia de Praias?`)) {
      try {
        await api.deleteAttraction(id);
        loadAttractions();
      } catch (err) {
        alert(err.message || 'Erro ao excluir');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Guia de Distâncias & Praias (CMS)
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Cadastre praias, suba fotos do computador, insira vídeos do YouTube, defina tempos e rotas GPS
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Praia</span>
        </button>
      </div>

      {/* Grid of Beaches */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 mt-3">Carregando praias...</p>
        </div>
      ) : attractions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-stone-200">
          <p className="text-stone-700 font-bold text-base">Nenhuma praia cadastrada.</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl"
          >
            Cadastrar Primeira Praia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((att) => (
            <div
              key={att.id}
              className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={att.image_url}
                    alt={att.name_pt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    {att.duration_badge_pt && (
                      <span className="bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {att.duration_badge_pt}
                      </span>
                    )}
                    {att.youtube_video_url && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Vídeo
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-sm">
                    {att.distance_label_pt || 'Arraial do Cabo'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {att.name_pt}
                    </h3>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md shrink-0">
                      Ordem: {att.order_index}
                    </span>
                  </div>

                  <p className="text-stone-600 text-xs line-clamp-3 leading-relaxed">
                    {att.description_pt || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                <a
                  href={`/montealto/praias/${att.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white rounded-xl transition-colors"
                  title="Ver Página da Praia"
                >
                  <Eye className="w-4 h-4" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(att)}
                    className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold py-2 px-3 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-600" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDelete(att.id, att.name_pt)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Excluir Praia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Beach */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-stone-100 my-8">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingItem ? 'Editar Praia / Atrativo' : 'Nova Praia / Atrativo'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {form.name_pt || 'Dados da Praia'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Photo Upload & Preview */}
              <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 uppercase block">
                  Foto de Destaque da Praia
                </span>

                {form.image_url ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-300 group bg-black">
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-xl opacity-90 group-hover:opacity-100 transition-opacity"
                      title="Trocar Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    uploading
                      ? 'bg-amber-50/60 border-amber-400 cursor-not-allowed'
                      : 'bg-white hover:bg-amber-50/50 border-amber-300/80 hover:border-amber-500'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-1 text-amber-700">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                        <span className="text-xs font-bold">Enviando imagem...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-stone-900 mt-1">
                          Subir Foto do Computador / Celular
                        </span>
                        <span className="text-[10px] text-stone-500">
                          JPG, PNG ou WEBP em alta definição
                        </span>
                      </div>
                    )}
                  </label>
                )}

                {/* Or paste URL */}
                <div>
                  <label className="block text-[10px] text-stone-500 font-bold mb-1">
                    Ou cole o link de uma imagem:
                  </label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://exemplo.com/praia.jpg"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Multilanguage Titles */}
              <div className="space-y-3 bg-amber-50/50 p-5 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-stone-700 uppercase block">
                  Nome da Praia / Atrativo (Multi-idioma)
                </span>

                <div>
                  <label className="block text-[10px] text-stone-600 font-bold mb-0.5">🇧🇷 Português *</label>
                  <input
                    type="text"
                    required
                    value={form.name_pt}
                    onChange={(e) => setForm({ ...form, name_pt: e.target.value })}
                    placeholder="Ex: Praia de Monte Alto"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-0.5">🇺🇸 Inglês (Opcional)</label>
                    <input
                      type="text"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      placeholder="Ex: Monte Alto Beach"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-bold mb-0.5">🇪🇸 Espanhol (Opcional)</label>
                    <input
                      type="text"
                      value={form.name_es}
                      onChange={(e) => setForm({ ...form, name_es: e.target.value })}
                      placeholder="Ex: Playa de Monte Alto"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Distance and Duration Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Tempo / Duração (Badge)
                  </label>
                  <input
                    type="text"
                    value={form.duration_badge_pt}
                    onChange={(e) => setForm({ ...form, duration_badge_pt: e.target.value })}
                    placeholder="Ex: 10-12 min de carro ou Pé na areia (0 min)"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Distância da Pousada
                  </label>
                  <input
                    type="text"
                    value={form.distance_label_pt}
                    onChange={(e) => setForm({ ...form, distance_label_pt: e.target.value })}
                    placeholder="Ex: Na porta da pousada ou 9 km"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* YouTube Video Tour Link */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-600" />
                  Link do Vídeo no YouTube (Tour da Praia)
                </label>
                <input
                  type="url"
                  value={form.youtube_video_url}
                  onChange={(e) => setForm({ ...form, youtube_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {form.youtube_video_url && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 p-2 block bg-stone-100">
                      Preview do Vídeo:
                    </span>
                    <YouTubeEmbed url={form.youtube_video_url} title="Preview do Vídeo" />
                  </div>
                )}
              </div>

              {/* Google Maps Route Link */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  Link Personalizado de Rota Google Maps (Opcional)
                </label>
                <input
                  type="url"
                  value={form.maps_url}
                  onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
                  placeholder="Deixe em branco para rota automática ou cole a URL do Google Maps"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Multilanguage Descriptions */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-stone-600 uppercase">
                  Descrição Completa da Praia (Português) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description_pt}
                  onChange={(e) => setForm({ ...form, description_pt: e.target.value })}
                  placeholder="Descreva as características da praia, cor da água, areia, quiosques e diferenciais..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tips */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Dicas de Visitação (Melhor horário, acesso, o que levar)
                </label>
                <textarea
                  rows={2}
                  value={form.tips_pt}
                  onChange={(e) => setForm({ ...form, tips_pt: e.target.value })}
                  placeholder="Ex: Chegue cedo pela manhã para garantir mesa nos quiosques..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Order Index & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(Number(form.is_active) === 1)}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Praia Ativa no Site Público
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Praia</span>
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
