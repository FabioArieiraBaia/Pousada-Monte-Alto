import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Plus, Edit2, Trash2, Video, 
  Image as ImageIcon, Calendar, X, Check, ArrowRight,
  Upload, Star, Loader2, Bold, Italic, Heading2,
  List, Quote, Link as LinkIcon, Sparkles
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { api } from '../../services/api';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [activeLang, setActiveLang] = useState('pt'); // 'pt' | 'en' | 'es'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'published' | 'draft' | 'unlisted'
  const [searchQuery, setSearchQuery] = useState('');

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const contentTextareaRef = useRef(null);

  const initialForm = {
    title_pt: '',
    title_en: '',
    title_es: '',
    excerpt_pt: '',
    excerpt_en: '',
    excerpt_es: '',
    content_pt: '',
    content_en: '',
    content_es: '',
    featured_image: '',
    gallery_photos: [],
    youtube_video_url: '',
    tags: 'arraial do cabo, monte alto, praias, dicas',
    is_published: 1
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    setLoading(true);
    api.getBlogPosts(false)
      .then(res => setPosts(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = async (post = null) => {
    if (post) {
      setEditingPost(post);
      let gal = [];
      if (Array.isArray(post.gallery_photos)) {
        gal = post.gallery_photos;
      } else if (typeof post.gallery_photos === 'string' && post.gallery_photos.trim()) {
        try { gal = JSON.parse(post.gallery_photos); } catch (e) { gal = []; }
      }

      // Initial populate
      setForm({
        id: post.id,
        title_pt: post.title_pt || '',
        title_en: post.title_en || '',
        title_es: post.title_es || '',
        excerpt_pt: post.excerpt_pt || '',
        excerpt_en: post.excerpt_en || '',
        excerpt_es: post.excerpt_es || '',
        content_pt: post.content_pt || '',
        content_en: post.content_en || '',
        content_es: post.content_es || '',
        featured_image: post.featured_image || '',
        gallery_photos: Array.isArray(gal) ? gal : [],
        youtube_video_url: post.youtube_video_url || '',
        tags: post.tags || '',
        is_published: post.is_published !== undefined ? post.is_published : 1
      });

      // If content was not loaded in list (cached or older API response), fetch full article by slug
      if (!post.content_pt && post.slug) {
        try {
          const res = await api.getBlogPostBySlug(post.slug);
          if (res.data) {
            setForm(prev => ({
              ...prev,
              content_pt: res.data.content_pt || prev.content_pt,
              content_en: res.data.content_en || prev.content_en,
              content_es: res.data.content_es || prev.content_es,
              gallery_photos: Array.isArray(res.data.gallery_photos) && res.data.gallery_photos.length > 0 
                ? res.data.gallery_photos 
                : prev.gallery_photos
            }));
          }
        } catch (err) {
          console.error('Erro ao carregar detalhes completos do artigo:', err);
        }
      }
    } else {
      setEditingPost(null);
      setForm(initialForm);
    }
    setActiveTab('editor');
    setActiveLang('pt');
    setModalOpen(true);
  };

  // Upload Cover Image
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const res = await api.uploadImage(file);
      const url = res.url || res.file_url;
      if (url) {
        setForm(prev => ({ ...prev, featured_image: url }));
      }
    } catch (err) {
      alert('Erro ao fazer upload da capa: ' + (err.message || 'Falha no envio'));
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Upload Multiple Gallery Photos
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingGallery(true);
    try {
      const newUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Enviando foto ${i + 1} de ${files.length}...`);
        const res = await api.uploadImage(files[i]);
        const url = res.url || res.file_url;
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) {
        setForm(prev => ({
          ...prev,
          gallery_photos: [...prev.gallery_photos, ...newUrls]
        }));
      }
    } catch (err) {
      alert('Erro ao fazer upload das fotos: ' + (err.message || 'Falha no envio'));
    } finally {
      setUploadingGallery(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  // Add Gallery photo by URL
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setForm(prev => ({
      ...prev,
      gallery_photos: [...prev.gallery_photos, newGalleryUrl.trim()]
    }));
    setNewGalleryUrl('');
  };

  // Remove photo from gallery
  const handleRemoveGalleryPhoto = (index) => {
    setForm(prev => ({
      ...prev,
      gallery_photos: prev.gallery_photos.filter((_, i) => i !== index)
    }));
  };

  // Set gallery photo as cover
  const handleSetGalleryAsCover = (index) => {
    const selected = form.gallery_photos[index];
    if (!selected) return;
    setForm(prev => ({
      ...prev,
      featured_image: selected
    }));
  };

  // Insert formatting into active content textarea without writing raw HTML
  const insertFormatting = (prefix, suffix = '', placeholder = '') => {
    const textarea = contentTextareaRef.current;
    const contentKey = `content_${activeLang}`;
    const currentValue = form[contentKey] || '';

    if (!textarea) {
      setForm(prev => ({
        ...prev,
        [contentKey]: currentValue + `\n${prefix}${placeholder}${suffix}\n`
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.substring(start, end) || placeholder;

    const before = currentValue.substring(0, start);
    const after = currentValue.substring(end);

    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;

    setForm(prev => ({
      ...prev,
      [contentKey]: newContent
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  // Insert inline image with caption into text
  const insertImageIntoText = (imageUrl, caption = '') => {
    const htmlImg = `<figure><img src="${imageUrl}" alt="${caption || 'Foto do artigo'}" /><figcaption>${caption || 'Legenda da foto'}</figcaption></figure>\n`;
    insertFormatting(htmlImg);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!form.title_pt.trim()) {
      alert('Por favor, informe o Título em Português.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        gallery_photos: form.gallery_photos
      };

      if (form.id) {
        await api.updateBlogPost(form.id, payload);
      } else {
        await api.createBlogPost(payload);
      }
      setModalOpen(false);
      loadPosts();
    } catch (err) {
      alert(err.message || 'Erro ao salvar artigo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este artigo do blog?')) return;
    try {
      await api.deleteBlogPost(id);
      loadPosts();
    } catch (err) {
      alert(err.message || 'Erro ao excluir artigo');
    }
  };

  const activeContent = form[`content_${activeLang}`] || '';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Gerenciamento do Blog & Dicas
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Publique matérias com imagens, vídeos do YouTube e dicas de Arraial do Cabo.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Escrever Novo Artigo</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos ({posts.length})
          </button>
          <button
            onClick={() => setFilterStatus('published')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'published'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🟢 Publicados ({posts.filter(p => p.is_published === 1).length})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'draft'
                ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🟡 Rascunhos ({posts.filter(p => p.is_published === 0).length})
          </button>
          <button
            onClick={() => setFilterStatus('unlisted')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'unlisted'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🔵 Não Listados ({posts.filter(p => p.is_published === 2).length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar matéria por título ou tag..."
            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(n => (
            <div key={n} className="h-80 bg-stone-200/60 rounded-3xl animate-pulse" />
          ))
        ) : (() => {
          const filteredPosts = posts.filter(p => {
            if (filterStatus === 'published' && p.is_published !== 1) return false;
            if (filterStatus === 'draft' && p.is_published !== 0) return false;
            if (filterStatus === 'unlisted' && p.is_published !== 2) return false;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchTitle = (p.title_pt || '').toLowerCase().includes(q);
              const matchTags = (p.tags || '').toLowerCase().includes(q);
              const matchExcerpt = (p.excerpt_pt || '').toLowerCase().includes(q);
              return matchTitle || matchTags || matchExcerpt;
            }
            return true;
          });

          return filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
            let galCount = 0;
            if (Array.isArray(post.gallery_photos)) galCount = post.gallery_photos.length;
            else if (typeof post.gallery_photos === 'string' && post.gallery_photos.trim()) {
              try { galCount = JSON.parse(post.gallery_photos).length; } catch (e) {}
            }

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-stone-200/80 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="h-48 relative overflow-hidden bg-stone-900">
                    <img
                      src={post.featured_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                      alt={post.title_pt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {post.is_published === 1 && (
                        <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          🟢 Publicado
                        </span>
                      )}
                      {post.is_published === 0 && (
                        <span className="bg-amber-500/95 backdrop-blur-md text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                          🟡 Rascunho
                        </span>
                      )}
                      {post.is_published === 2 && (
                        <span className="bg-sky-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          🔵 Não Listado
                        </span>
                      )}
                      {post.youtube_video_url && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Video className="w-3 h-3" /> Vídeo
                        </span>
                      )}
                      {galCount > 0 && (
                        <span className="bg-stone-900/85 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <ImageIcon className="w-3 h-3" /> {galCount} fotos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900 leading-snug line-clamp-2">
                      {post.title_pt}
                    </h3>
                    <p className="text-stone-500 text-xs leading-relaxed line-clamp-3">
                      {post.excerpt_pt || 'Sem resumo cadastrado.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : 'Publicado'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenModal(post)}
                      className="bg-stone-100 hover:bg-amber-50 hover:text-amber-700 text-stone-800 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Editar Matéria Completa"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl text-xs transition-colors"
                      title="Excluir Artigo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-200/80 space-y-3">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">
              Nenhuma matéria encontrada
            </h3>
            <p className="text-stone-500 text-xs">
              Tente alterar os filtros de status ou a busca acima, ou crie uma nova matéria.
            </p>
          </div>
        );
      })()}
      </div>

      {/* 🚀 MODAL DE EDIÇÃO TOTAL DO ARTIGO COM FOTOS ILIMITADAS & FORMATADOR VISUAL 🚀 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-stone-100 my-4 flex flex-col max-h-[92vh]">
            
            {/* Modal Top Header */}
            <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingPost ? '✏️ Editor Completo de Artigo' : '✨ Nova Matéria do Blog'}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5 truncate max-w-lg">
                  {form.title_pt || 'Título da Matéria'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleSavePost} className="p-6 space-y-6 overflow-y-auto flex-1">

              {/* Idioma Selector Tabs */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">Idioma em Edição:</span>
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveLang('pt')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeLang === 'pt' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🇧🇷 Português
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLang('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeLang === 'en' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLang('es')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeLang === 'es' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🇪🇸 Español
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                  {activeLang === 'pt' ? 'Principal (Obrigatório)' : 'Opcional (se vazio, usa o Português)'}
                </span>
              </div>

              {/* Título e Resumo do Idioma Selecionado */}
              <div className="space-y-4 bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                    Título da Matéria ({activeLang.toUpperCase()}) {activeLang === 'pt' && '*'}
                  </label>
                  <input
                    type="text"
                    required={activeLang === 'pt'}
                    value={form[`title_${activeLang}`]}
                    onChange={(e) => setForm({ ...form, [`title_${activeLang}`]: e.target.value })}
                    placeholder={
                      activeLang === 'pt'
                        ? 'Ex: Por que se hospedar em Monte Alto: O refúgio secreto de Arraial do Cabo'
                        : activeLang === 'en'
                        ? 'Why Stay in Monte Alto: The Secret Haven of Arraial do Cabo'
                        : 'Por qué alojarse en Monte Alto: El refugio secreto de Arraial del Cabo'
                    }
                    className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                    Resumo / Subtítulo da Matéria ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    value={form[`excerpt_${activeLang}`]}
                    onChange={(e) => setForm({ ...form, [`excerpt_${activeLang}`]: e.target.value })}
                    placeholder="Um breve parágrafo chamativo que aparece nos cards e no início do artigo..."
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-700"
                  />
                </div>
              </div>

              {/* 📸 SEÇÃO 1: FOTO DE CAPA PRINCIPAL (UPLOAD DIRETO OU URL) 📸 */}
              <div className="space-y-3 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Foto de Capa Principal da Matéria *
                  </span>
                  {form.featured_image && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Capa Definida
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Preview da Capa Atual */}
                  <div className="h-36 rounded-2xl overflow-hidden bg-stone-900 relative group border border-stone-300 shadow-sm">
                    {form.featured_image ? (
                      <>
                        <img src={form.featured_image} alt="Capa" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, featured_image: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover Capa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 p-2 text-center">
                        <ImageIcon className="w-8 h-8 text-stone-500" />
                        <span className="text-[10px]">Nenhuma capa selecionada</span>
                      </div>
                    )}
                  </div>

                  {/* Upload do Arquivo da Capa */}
                  <div className="md:col-span-2 space-y-2">
                    <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                      uploadingCover ? 'bg-amber-100 border-amber-400 cursor-not-allowed' : 'bg-white hover:bg-amber-50 border-amber-300 hover:border-amber-500'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCover}
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      {uploadingCover ? (
                        <div className="flex items-center gap-2 text-amber-700 text-xs font-bold py-1">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                          <span>Subindo foto de capa...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-stone-800 text-xs font-bold py-1">
                          <Upload className="w-4 h-4 text-amber-600" />
                          <span>Fazer Upload da Capa do Computador ou Celular</span>
                        </div>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Ou URL direta:</span>
                      <input
                        type="url"
                        value={form.featured_image}
                        onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-xs p-2 rounded-xl border border-stone-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 📸 SEÇÃO 2: GALERIA DE FOTOS DA MATÉRIA (QUANTAS FOTOS QUISER!) 📸 */}
              <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-stone-800 uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      Galeria de Fotos da Matéria (Upe quantas fotos desejar)
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Essas fotos serão exibidas em carrossel e em grid no artigo para enriquecer a experiência do leitor.
                    </span>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                    {form.gallery_photos.length} {form.gallery_photos.length === 1 ? 'foto cadastrada' : 'fotos cadastradas'}
                  </span>
                </div>

                {/* Box de Upload Múltiplo */}
                <label className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  uploadingGallery
                    ? 'bg-amber-50/80 border-amber-400 cursor-not-allowed'
                    : 'bg-white hover:bg-amber-50/50 border-amber-300/80 hover:border-amber-500 shadow-sm'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGallery}
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  {uploadingGallery ? (
                    <div className="flex flex-col items-center gap-2 py-2 text-amber-700">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      <span className="text-xs font-bold">{uploadProgress || 'Processando fotos...'}</span>
                      <span className="text-[10px] text-stone-500">Gravando fotos no servidor</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 mt-1">
                        Clique aqui para Subir Múltiplas Fotos da Matéria
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Selecione 5, 10, 20 ou quantas fotos quiser de uma só vez (JPG, PNG, WEBP).
                      </span>
                    </div>
                  )}
                </label>

                {/* Adicionar por URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Ou cole a URL de uma foto para a galeria..."
                    className="flex-1 text-xs p-2 rounded-xl border border-stone-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-3 py-2 rounded-xl"
                  >
                    Adicionar URL
                  </button>
                </div>

                {/* Grid das fotos da galeria com ações rápidas */}
                {form.gallery_photos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase block">
                      Fotos na Galeria do Artigo:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {form.gallery_photos.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group h-28 rounded-2xl overflow-hidden border-2 border-stone-200 hover:border-amber-400 bg-stone-950 shadow-sm transition-all"
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />

                          {/* Botão de Excluir da Galeria */}
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryPhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-90 group-hover:opacity-100 shadow-md transition-opacity"
                            title="Remover esta foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão de Definir como Capa */}
                          <button
                            type="button"
                            onClick={() => handleSetGalleryAsCover(idx)}
                            className="absolute bottom-1.5 left-1.5 bg-black/75 hover:bg-amber-500 hover:text-stone-950 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-md"
                            title="Usar como Foto de Capa"
                          >
                            <Star className="w-2.5 h-2.5" />
                            Capa
                          </button>

                          {/* Inserir no Texto */}
                          <button
                            type="button"
                            onClick={() => insertImageIntoText(imgUrl)}
                            className="absolute top-1.5 left-1.5 bg-black/75 hover:bg-amber-500 hover:text-stone-950 text-white text-[9px] font-bold px-1.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Inserir esta foto no corpo do texto"
                          >
                            + No Texto
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vídeo do YouTube */}
              <div className="space-y-3 bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Link de Vídeo no YouTube (Opcional)
                </label>
                <input
                  type="url"
                  value={form.youtube_video_url}
                  onChange={(e) => setForm({ ...form, youtube_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {form.youtube_video_url && (
                  <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm max-w-md">
                    <span className="text-[10px] font-bold text-stone-500 block mb-1.5">Preview do Vídeo:</span>
                    <YouTubeEmbed url={form.youtube_video_url} />
                  </div>
                )}
              </div>

              {/* ✍️ SEÇÃO 3: EDITOR TOTALMENTE AUTO-EDITÁVEL (SEM HTML) ✍️ */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-stone-800 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Conteúdo Completo do Artigo ({activeLang.toUpperCase()})
                  </label>

                  {/* Alternar Editor / Pré-visualização */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'editor' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      ✏️ Escrever
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      👁️ Pré-visualizar
                    </button>
                  </div>
                </div>

                {activeTab === 'editor' ? (
                  <div className="rounded-2xl border border-stone-300 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-amber-500">
                    
                    {/* Barra de Ferramentas Amigável (Formatação de 1-Clique) */}
                    <div className="bg-stone-100/90 p-2.5 border-b border-stone-200 flex flex-wrap items-center gap-1.5 text-stone-700">
                      
                      {/* Títulos */}
                      <button
                        type="button"
                        onClick={() => insertFormatting('<h3>', '</h3>', 'Subtítulo da Seção')}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Adicionar Subtítulo H3"
                      >
                        <Heading2 className="w-4 h-4" />
                        <span>Subtítulo</span>
                      </button>

                      <div className="h-4 w-px bg-stone-300 mx-1" />

                      {/* Negrito e Itálico */}
                      <button
                        type="button"
                        onClick={() => insertFormatting('<strong>', '</strong>', 'texto em destaque')}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 transition-colors"
                        title="Negrito (Destaque)"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('<em>', '</em>', 'texto itálico')}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 transition-colors"
                        title="Itálico"
                      >
                        <Italic className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-stone-300 mx-1" />

                      {/* Listas */}
                      <button
                        type="button"
                        onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n  <li>Segundo item</li>\n</ul>', 'Primeiro item')}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Lista com Marcadores"
                      >
                        <List className="w-4 h-4" />
                        <span>Lista</span>
                      </button>

                      {/* Citação */}
                      <button
                        type="button"
                        onClick={() => insertFormatting('<blockquote>', '</blockquote>', 'Dica importante ou citação inspiradora')}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Caixa de Dica / Citação"
                      >
                        <Quote className="w-4 h-4" />
                        <span>Dica / Destaque</span>
                      </button>

                      {/* Link */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Digite o link (URL):', 'https://');
                          if (url) insertFormatting(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>', 'Clique aqui');
                        }}
                        className="p-1.5 rounded-lg hover:bg-white hover:text-amber-600 transition-colors"
                        title="Inserir Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-stone-300 mx-1" />

                      {/* Parágrafo Simples */}
                      <button
                        type="button"
                        onClick={() => insertFormatting('<p>', '</p>', 'Escreva aqui o seu parágrafo...')}
                        className="p-1.5 rounded-lg hover:bg-white text-xs font-medium text-stone-600"
                        title="Inserir Parágrafo"
                      >
                        + Parágrafo
                      </button>

                      {/* Ajuda Rápida */}
                      <span className="ml-auto text-[10px] text-stone-400 hidden sm:inline">
                        💡 Dica: Quebre linhas naturalmente. As tags são inseridas automaticamente com 1 clique.
                      </span>
                    </div>

                    {/* Textarea do Artigo */}
                    <textarea
                      ref={contentTextareaRef}
                      rows={12}
                      required={activeLang === 'pt'}
                      value={activeContent}
                      onChange={(e) => setForm({ ...form, [`content_${activeLang}`]: e.target.value })}
                      placeholder="Escreva seu artigo aqui. Use os botões acima para formatar subtítulos, destaques, listas e dicas sem precisar programar..."
                      className="w-full text-sm p-4 focus:outline-none font-sans leading-relaxed text-stone-800 resize-y"
                    />
                  </div>
                ) : (
                  /* Modo Pré-visualização em Tempo Real (Com Alto Contraste como no Site) */
                  <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-inner max-h-96 overflow-y-auto space-y-4">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block pb-2 border-b border-stone-800">
                      Prévia como aparecerá no site:
                    </span>
                    <div
                      className="blog-content text-white leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: activeContent || '<p class="text-stone-400 italic">Nenhum conteúdo digitado ainda...</p>' }}
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tags & Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="praias, arraial do cabo, turismo, pousada monte alto"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              {/* Status de Publicação: Publicado, Rascunho, Não Listado */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Status de Visibilidade da Matéria
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.is_published === 1 ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-sm' : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <input
                      type="radio"
                      name="is_published"
                      value={1}
                      checked={form.is_published === 1}
                      onChange={() => setForm({ ...form, is_published: 1 })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs">🟢 Publicado</div>
                      <div className="text-[10px] text-stone-500 font-normal">Visível no blog e motores de busca</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.is_published === 0 ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-sm' : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <input
                      type="radio"
                      name="is_published"
                      value={0}
                      checked={form.is_published === 0}
                      onChange={() => setForm({ ...form, is_published: 0 })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs">🟡 Rascunho</div>
                      <div className="text-[10px] text-stone-500 font-normal">Oculto de visitantes (apenas admin)</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.is_published === 2 ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold shadow-sm' : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <input
                      type="radio"
                      name="is_published"
                      value={2}
                      checked={form.is_published === 2}
                      onChange={() => setForm({ ...form, is_published: 2 })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">🔵 Não Listado</div>
                      <div className="text-[10px] text-stone-500 font-normal">Acessível só por link direto</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingCover || uploadingGallery}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-7 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Artigo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingPost ? 'Salvar Alterações' : 'Publicar Artigo'}</span>
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
