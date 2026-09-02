import React, { useState, useEffect } from 'react';
import { 
  BedDouble, Plus, Edit2, Trash2, PawPrint, 
  Video, DollarSign, Sparkles, X, Check, Upload, Image as ImageIcon
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { api } from '../../services/api';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const initialFormState = {
    id: null,
    name_pt: '',
    name_en: '',
    name_es: '',
    type: 'suite',
    base_price: 350,
    max_guests: 2,
    accepts_pets: 0,
    youtube_video_url: '',
    description_pt: '',
    description_en: '',
    description_es: '',
    amenities: ['wifi', 'ar_condicionado', 'frigobar', 'smart_tv'],
    photos: []
  };

  const [form, setForm] = useState(initialFormState);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const availableAmenities = [
    { key: 'wifi', label: 'Wi-Fi Fibra' },
    { key: 'ar_condicionado', label: 'Ar Condicionado Split' },
    { key: 'hidromassagem', label: 'Hidromassagem' },
    { key: 'cama_king', label: 'Cama King Size' },
    { key: 'cama_queen', label: 'Cama Queen Size' },
    { key: 'sofa_cama', label: 'Sofá-Cama' },
    { key: 'frigobar', label: 'Frigobar' },
    { key: 'smart_tv', label: 'Smart TV' },
    { key: 'vista_mar', label: 'Vista Mar' },
    { key: 'vista_lagoa', label: 'Vista Lagoa' },
    { key: 'cafe_da_manha', label: 'Café da Manhã' },
    { key: 'estacionamento', label: 'Estacionamento' },
    { key: 'pet_friendly', label: 'Pet Friendly' },
    { key: 'varanda_com_rede', label: 'Varanda com Rede' },
    { key: 'cozinha_completa', label: 'Cozinha Completa' },
    { key: 'churrasqueira', label: 'Churrasqueira' },
    { key: 'jardim_privativo', label: 'Jardim Privativo' },
    { key: 'banheira', label: 'Banheira de Imersão' }
  ];

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = () => {
    setLoading(true);
    api.getAccommodations(false)
      .then(res => setRooms(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setForm({
        id: room.id,
        name_pt: room.name_pt || '',
        name_en: room.name_en || room.name_pt || '',
        name_es: room.name_es || room.name_pt || '',
        type: room.type || 'suite',
        base_price: room.base_price || 350,
        max_guests: room.max_guests || 2,
        accepts_pets: room.accepts_pets ? 1 : 0,
        youtube_video_url: room.youtube_video_url || '',
        description_pt: room.description_pt || '',
        description_en: room.description_en || '',
        description_es: room.description_es || '',
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
        photos: (room.photos || []).map(p => p.photo_url || p)
      });
    } else {
      setEditingRoom(null);
      setForm(initialFormState);
    }
    setModalOpen(true);
  };

  const handleToggleAmenity = (key) => {
    setForm(prev => {
      const exists = prev.amenities.includes(key);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== key)
          : [...prev.amenities, key]
      };
    });
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setForm(prev => ({
      ...prev,
      photos: [...prev.photos, newPhotoUrl.trim()]
    }));
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (form.id) {
        await api.updateAccommodation(form.id, form);
      } else {
        await api.createAccommodation(form);
      }
      setModalOpen(false);
      loadRooms();
    } catch (err) {
      alert(err.message || 'Erro ao salvar acomodação');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta acomodação?')) return;
    try {
      await api.deleteAccommodation(id);
      loadRooms();
    } catch (err) {
      alert(err.message || 'Erro ao excluir acomodação');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Gerenciamento de Suítes & Lofts
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Cadastre, edite fotos, vídeos do YouTube, comodidades e preços das diárias.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Nova Acomodação</span>
        </button>
      </div>

      {/* Rooms Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const cover = room.cover_photo || (room.photos && room.photos[0]?.photo_url) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
          
          return (
            <div
              key={room.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 relative overflow-hidden bg-stone-100">
                  <img
                    src={cover}
                    alt={room.name_pt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {room.type === 'loft' ? 'Loft' : 'Suíte'}
                    </span>
                    {room.accepts_pets == 1 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PawPrint className="w-3 h-3" /> Pet Friendly
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {room.name_pt}
                    </h3>
                    <span className="text-amber-600 font-bold text-sm font-serif">
                      {formatCurrency(room.base_price)}
                    </span>
                  </div>

                  <p className="text-stone-600 text-xs line-clamp-2">
                    {room.description_pt}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                    <span>👥 Max: {room.max_guests} pessoas</span>
                    <span>•</span>
                    <span>📸 {(room.photos || []).length} fotos</span>
                    {room.youtube_video_url && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-bold flex items-center gap-0.5">
                          <Video className="w-3 h-3" /> Vídeo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(room)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Editar Acomodação"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl text-xs font-semibold transition-colors"
                  title="Excluir Acomodação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal CRUD Room */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-100 my-8">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingRoom ? 'Editar Quarto / Loft' : 'Nova Acomodação'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  {form.name_pt || 'Dados da Acomodação'}
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
            <form onSubmit={handleSaveRoom} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Type, Base Price, Max Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Tipo de Acomodação
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="suite">Suíte</option>
                    <option value="loft">Loft / Bangalô</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Diária Base (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Capacidade Máx (Pessoas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.max_guests}
                    onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multilanguage Titles */}
              <div className="space-y-3 bg-sand-50 p-4 rounded-2xl border border-sand-200">
                <span className="text-[11px] font-bold text-stone-700 uppercase block">
                  Nome da Acomodação (Multi-idioma)
                </span>
                
                <div>
                  <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🇧🇷 Português *</label>
                  <input
                    type="text"
                    required
                    value={form.name_pt}
                    onChange={(e) => setForm({ ...form, name_pt: e.target.value })}
                    placeholder="Ex: Suíte Master Pé na Areia"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🇺🇸 Inglês</label>
                    <input
                      type="text"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      placeholder="Ex: Master Beachfront Suite"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🇪🇸 Espanhol</label>
                    <input
                      type="text"
                      value={form.name_es}
                      onChange={(e) => setForm({ ...form, name_es: e.target.value })}
                      placeholder="Ex: Suite Master Frente al Mar"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pet Friendly Toggle & YouTube Video URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                
                <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepts_pets == 1}
                    onChange={(e) => setForm({ ...form, accepts_pets: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                      Aceita Pets (Pet Friendly)
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Habilita o selo e filtro pet friendly no site
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    Link do Vídeo no YouTube
                  </label>
                  <input
                    type="url"
                    value={form.youtube_video_url}
                    onChange={(e) => setForm({ ...form, youtube_video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* YouTube Preview if provided */}
              {form.youtube_video_url && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-bold text-stone-500 block mb-2">Preview do Vídeo YouTube:</span>
                  <YouTubeEmbed url={form.youtube_video_url} />
                </div>
              )}

              {/* Descriptions */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Descrição Detalhada (Português)
                </label>
                <textarea
                  rows={3}
                  value={form.description_pt}
                  onChange={(e) => setForm({ ...form, description_pt: e.target.value })}
                  placeholder="Descreva a suíte, tipo de cama, vista, diferencial e aconchego..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Amenities Checkboxes */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-2">
                  Comodidades & Itens Inclusos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableAmenities.map(am => (
                    <label
                      key={am.key}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        form.amenities.includes(am.key)
                          ? 'bg-amber-50 border-amber-300 text-stone-900 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(am.key)}
                        onChange={() => handleToggleAmenity(am.key)}
                        className="w-3.5 h-3.5 text-amber-600 rounded"
                      />
                      <span>{am.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos Gallery Management */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-700 uppercase">
                  Galeria de Fotos da Acomodação
                </label>

                {/* Add Photo Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Cole a URL da imagem (Ex: https://...)"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0"
                  >
                    Adicionar Foto
                  </button>
                </div>

                {/* Photo Previews */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {form.photos.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-xl overflow-hidden group border border-stone-300">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-amber-500 text-stone-950 font-bold text-[9px] px-1.5 py-0.5 rounded">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md"
                >
                  {saving ? 'Salvando...' : 'Salvar Acomodação'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
