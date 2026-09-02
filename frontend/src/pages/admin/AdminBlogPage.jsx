import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Edit2, Trash2, Video, 
  Image as ImageIcon, Calendar, X, Check, ArrowRight
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { api } from '../../services/api';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

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
    youtube_video_url: '',
    tags: 'arraial do cabo, monte alto, praias, turismo'
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

  const handleOpenModal = (post = null) => {
    if (post) {
      setEditingPost(post);
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
        youtube_video_url: post.youtube_video_url || '',
        tags: post.tags || ''
      });
    } else {
      setEditingPost(null);
      setForm(initialForm);
    }
    setModalOpen(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.updateBlogPost(form.id, form);
      } else {
        await api.createBlogPost(form);
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

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 flex flex-col justify-between"
          >
            <div>
              <div className="h-44 relative overflow-hidden bg-stone-100">
                <img
                  src={post.featured_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                  alt={post.title_pt}
                  className="w-full h-full object-cover"
                />
                {post.youtube_video_url && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Video className="w-3 h-3" /> Vídeo YouTube
                  </span>
                )}
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[10px] text-stone-400 font-mono">
                  {new Date(post.published_at).toLocaleDateString('pt-BR')}
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-2">
                  {post.title_pt}
                </h3>
                <p className="text-stone-600 text-xs line-clamp-3">
                  {post.excerpt_pt}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenModal(post)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit/Create Post */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-100 my-8">
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingPost ? 'Editar Matéria' : 'Nova Matéria do Blog'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {form.title_pt || 'Conteúdo do Artigo'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-stone-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Título em Português *
                </label>
                <input
                  type="text"
                  required
                  value={form.title_pt}
                  onChange={(e) => setForm({ ...form, title_pt: e.target.value })}
                  placeholder="Ex: As 5 Melhores Praias de Arraial do Cabo"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Título em Inglês
                  </label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Título em Espanhol
                  </label>
                  <input
                    type="text"
                    value={form.title_es}
                    onChange={(e) => setForm({ ...form, title_es: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Foto de Capa (URL)
                  </label>
                  <input
                    type="url"
                    value={form.featured_image}
                    onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Link de Vídeo no YouTube
                  </label>
                  <input
                    type="url"
                    value={form.youtube_video_url}
                    onChange={(e) => setForm({ ...form, youtube_video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              {form.youtube_video_url && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-bold text-stone-500 block mb-2">Preview do Vídeo:</span>
                  <YouTubeEmbed url={form.youtube_video_url} />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Resumo / Chamada (Português)
                </label>
                <textarea
                  rows={2}
                  value={form.excerpt_pt}
                  onChange={(e) => setForm({ ...form, excerpt_pt: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Conteúdo Completo (HTML / Texto Rico)
                </label>
                <textarea
                  rows={6}
                  required
                  value={form.content_pt}
                  onChange={(e) => setForm({ ...form, content_pt: e.target.value })}
                  placeholder="<p>Texto do artigo...</p> <h3>Subtítulo</h3>"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="praias, arraial do cabo, dicas"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider"
                >
                  {saving ? 'Publicando...' : 'Publicar Artigo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
