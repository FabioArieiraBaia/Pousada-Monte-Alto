import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Image as ImageIcon, 
  Upload, Check, X, Sparkles, MoveUp, MoveDown 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    image_url: '',
    category: 'geral',
    order_index: 0
  });

  const categories = [
    { key: 'geral', label: 'Geral' },
    { key: 'praia', label: 'Praia & Mar' },
    { key: 'suites', label: 'Suítes & Lofts' },
    { key: 'sunset', label: 'Pôr do Sol / Lagoa' },
    { key: 'areas_comuns', label: 'Áreas Externas & Jardim' }
  ];

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = () => {
    setLoading(true);
    api.getGallery()
      .then(res => setItems(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        id: item.id,
        title: item.title || '',
        image_url: item.image_url || '',
        category: item.category || 'geral',
        order_index: item.order_index || 0
      });
    } else {
      setEditingItem(null);
      setForm({
        title: '',
        image_url: '',
        category: 'geral',
        order_index: items.length + 1
      });
    }
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res.file_url) {
        setForm(prev => ({ ...prev, image_url: res.file_url }));
      }
    } catch (err) {
      alert('Erro ao fazer upload da imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      alert('Por favor, informe a imagem (URL ou Upload).');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await api.updateGalleryItem(form.id, form);
      } else {
        await api.createGalleryItem(form);
      }
      setModalOpen(false);
      loadGallery();
    } catch (err) {
      alert(err.message || 'Erro ao salvar foto da galeria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Tem certeza que deseja remover "${title}" da galeria?`)) {
      try {
        await api.deleteGalleryItem(id);
        loadGallery();
      } catch (err) {
        alert(err.message || 'Erro ao remover foto');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            <span>Galeria de Momentos & Espaços</span>
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Gerencie as fotos dos ambientes da pousada que aparecem na página inicial e no site
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Nova Foto</span>
        </button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-48 bg-stone-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="relative h-56 bg-stone-100 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {categories.find(c => c.key === item.category)?.label || item.category}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-3 bg-white">
                <div>
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-stone-400 block">
                    Ordem de exibição: #{item.order_index}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 space-y-3">
          <ImageIcon className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            Nenhuma foto cadastrada na galeria
          </h3>
          <p className="text-stone-500 text-xs">
            Clique no botão acima para adicionar sua primeira foto.
          </p>
        </div>
      )}

      {/* Modal CRUD Gallery Item */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100 my-8">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingItem ? 'Editar Foto da Galeria' : 'Nova Foto'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {form.title || 'Dados da Imagem'}
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
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Title / Legenda */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Título / Legenda da Foto *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Praia de Monte Alto, Área da Piscina, Jardim..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              {/* Category & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Input & Preview */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-stone-600 uppercase">
                  URL da Imagem ou Upload
                </label>
                
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/... ou cole a URL"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2 px-3 rounded-xl border border-stone-200 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Enviando arquivo...' : 'Fazer Upload do Computador'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Preview */}
              {form.image_url && (
                <div className="h-44 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

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
                  disabled={saving || uploading}
                  className="bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Foto</span>
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
