import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, PawPrint, Eye, 
  Image as ImageIcon, Check, X, Video, Sparkles, DollarSign, Users, AlertCircle, Flame, Tag 
} from 'lucide-react';
import YouTubeEmbed from '../../components/YouTubeEmbed';
import { api } from '../../services/api';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const initialFormState = {
    name_pt: '',
    name_en: '',
    name_es: '',
    type: 'suite',
    base_price: 350,
    max_guests: 2,
    accepts_pets: 0,
    is_promo: 1,
    youtube_video_url: '',
    description_pt: '',
    description_en: '',
    description_es: '',
    amenities: [],
    photos: []
  };

  const [form, setForm] = useState(initialFormState);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const availableAmenities = [
    { key: 'wifi', label: 'Wi-Fi Fibra Óptica' },
    { key: 'ar_condicionado', label: 'Ar Condicionado Split' },
    { key: 'frigobar', label: 'Frigobar' },
    { key: 'smart_tv', label: 'Smart TV' },
    { key: 'vista_mar', label: 'Vista para o Mar' },
    { key: 'hidromassagem', label: 'Hidromassagem / Banheira' },
    { key: 'cama_king', label: 'Cama King Size' },
    { key: 'varanda_rede', label: 'Varanda com Rede' },
    { key: 'cozinha_completa', label: 'Cozinha Americana Completa' },
    { key: 'estacionamento', label: 'Estacionamento Incluso' },
    { key: 'pet_friendly', label: 'Aceita Pets 🐾' },
    { key: 'cafe_manha', label: 'Café da Manhã Opcional' }
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
        accepts_pets: Number(room.accepts_pets) === 1 ? 1 : 0,
        is_promo: room.is_promo !== undefined ? (Number(room.is_promo) === 1 ? 1 : 0) : 1,
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
      const newAmenities = exists 
        ? prev.amenities.filter(a => a !== key)
        : [...prev.amenities, key];
      
      let newAcceptsPets = prev.accepts_pets;
      if (key === 'pet_friendly') {
        newAcceptsPets = !exists ? 1 : 0;
      }

      return {
        ...prev,
        accepts_pets: newAcceptsPets,
        amenities: newAmenities
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
      const payload = {
        ...form,
        accepts_pets: Number(form.accepts_pets) === 1 ? 1 : 0,
        is_promo: Number(form.is_promo) === 1 ? 1 : 0
      };
      if (form.id) {
        await api.updateAccommodation(form.id, payload);
      } else {
        await api.createAccommodation(payload);
      }
      setModalOpen(false);
      loadRooms();
    } catch (err) {
      alert(err.message || 'Erro ao salvar acomodação');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        await api.deleteAccommodation(id);
        loadRooms();
      } catch (err) {
        alert(err.message || 'Erro ao excluir acomodação');
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Gerenciador de Acomodações
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Cadastre suítes, lofts, defina tarifas promocionais (Sob Consulta), fotos e comodidades
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Acomodação</span>
        </button>
      </div>

      {/* Grid of Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const cover = room.cover_photo || (room.photos && room.photos[0]?.photo_url) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
          const isPet = Number(room.accepts_pets) === 1;
          const isPromo = Number(room.is_promo) === 1;

          return (
            <div
              key={room.id}
              className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={cover}
                    alt={room.name_pt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {room.type === 'loft' ? 'Loft' : 'Suíte'}
                    </span>
                    {isPet ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PawPrint className="w-3 h-3" />
                        Pet Friendly
                      </span>
                    ) : (
                      <span className="bg-stone-700/80 text-stone-300 text-[10px] px-2 py-0.5 rounded-full">
                        Sem Pets
                      </span>
                    )}
                    {isPromo && (
                      <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Flame className="w-3 h-3" />
                        Sob Consulta
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-stone-900 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm text-right">
                    {isPromo ? (
                      <div>
                        <span className="line-through text-stone-400 text-[10px] block leading-none font-normal">
                          {formatCurrency(room.base_price)}
                        </span>
                        <span className="text-amber-600 font-extrabold text-xs block">
                          Sob Consulta
                        </span>
                      </div>
                    ) : (
                      <div>
                        {formatCurrency(room.base_price)} <span className="text-[10px] font-normal text-stone-600">/noite</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {room.name_pt}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        Até {room.max_guests} pessoas
                      </span>
                      {room.youtube_video_url && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <Video className="w-3.5 h-3.5" />
                          Vídeo Tour
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-stone-600 text-xs line-clamp-2">
                    {room.description_pt || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Amenities Badges Preview */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(room.amenities || []).slice(0, 4).map((am, idx) => (
                      <span key={idx} className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-md">
                        {am.replace('_', ' ')}
                      </span>
                    ))}
                    {(room.amenities || []).length > 4 && (
                      <span className="text-stone-400 text-[10px] self-center">
                        +{room.amenities.length - 4} mais
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenModal(room)}
                  className="flex-1 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold py-2 px-3 rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar Quarto</span>
                </button>

                <button
                  onClick={() => handleDeleteRoom(room.id, room.name_pt)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                    Diária Base de Referência (R$) *
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

              {/* Promo Mode & Pet Friendly Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(Number(form.is_promo) === 1)}
                    onChange={(e) => setForm({ ...form, is_promo: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-amber-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Modo Promocional (Sob Consulta)
                    </span>
                    <span className="text-[10px] text-stone-600 block">
                      Risca o preço e exibe "Sob Consulta"
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(Number(form.accepts_pets) === 1)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setForm(prev => ({
                        ...prev,
                        accepts_pets: isChecked ? 1 : 0,
                        amenities: isChecked 
                          ? (prev.amenities.includes('pet_friendly') ? prev.amenities : [...prev.amenities, 'pet_friendly'])
                          : prev.amenities.filter(a => a !== 'pet_friendly')
                      }));
                    }}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                      Aceita Pets (Pet Friendly)
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Habilita o selo e filtro pet friendly
                    </span>
                  </div>
                </label>
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
                    <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🇺🇸 Inglês (Opcional)</label>
                    <input
                      type="text"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      placeholder="Ex: Beachfront Master Suite"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🇪🇸 Espanhol (Opcional)</label>
                    <input
                      type="text"
                      value={form.name_es}
                      onChange={(e) => setForm({ ...form, name_es: e.target.value })}
                      placeholder="Ex: Suite Master Frente a la Playa"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* YouTube Link */}
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
                        className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                      />
                      <span>{am.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos Gallery Management */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 uppercase block">
                  Galeria de Fotos
                </span>
                
                {/* Photo URLs List */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {form.photos.map((photo, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-stone-300 bg-black">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-amber-500 text-stone-950 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Photo Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Cole a URL da foto (https://...)"
                    className="flex-1 text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors"
                  >
                    Adicionar Foto
                  </button>
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
                  disabled={saving}
                  className="bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Acomodação</span>
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
