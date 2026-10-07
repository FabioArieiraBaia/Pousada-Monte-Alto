import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Calendar, Sparkles, Check, X, 
  AlertCircle, CheckCircle2, Clock, DollarSign, BedDouble, 
  Power, Layers, ShieldCheck, Tag
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminPackagesTab({ rooms = [] }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialFormState = {
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: 1,
    accommodations: []
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await api.getPackages();
      setPackages(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus, name) => {
    try {
      await api.togglePackage(id);
      loadPackages();
    } catch (err) {
      alert(err.message || 'Erro ao alternar status do pacote');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir o pacote "${name}"?`)) {
      try {
        await api.deletePackage(id);
        loadPackages();
      } catch (err) {
        alert(err.message || 'Erro ao excluir pacote');
      }
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      // Mapear acomodações existentes com os dados dos quartos
      const pkgAccommodations = (rooms || []).map(r => {
        const found = (pkg.accommodations || []).find(pa => pa.accommodation_id === r.id);
        return {
          accommodation_id: r.id,
          name_pt: r.name_pt,
          type: r.type,
          base_price: r.base_price,
          cover_photo: r.cover_photo || (r.photos && r.photos[0]?.photo_url),
          price_per_night: found ? found.price_per_night : Math.round(r.base_price * 1.5),
          min_nights: found ? found.min_nights : (r.type === 'loft' ? 3 : 2),
          is_active: found ? Number(found.is_active) : 1
        };
      });

      setForm({
        id: pkg.id,
        name: pkg.name || '',
        start_date: pkg.start_date || '',
        end_date: pkg.end_date || '',
        description: pkg.description || '',
        is_active: Number(pkg.is_active) === 1 ? 1 : 0,
        accommodations: pkgAccommodations
      });
    } else {
      setEditingPackage(null);
      // Criar nova lista a partir dos quartos cadastrados
      const defaultAccommodations = (rooms || []).map(r => ({
        accommodation_id: r.id,
        name_pt: r.name_pt,
        type: r.type,
        base_price: r.base_price,
        cover_photo: r.cover_photo || (r.photos && r.photos[0]?.photo_url),
        price_per_night: Math.round(r.base_price * 1.4),
        min_nights: r.type === 'loft' ? 3 : 2,
        is_active: 1
      }));

      setForm({
        ...initialFormState,
        accommodations: defaultAccommodations
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Por favor, informe o nome do pacote.');
      return;
    }
    if (!form.start_date || !form.end_date) {
      alert('Por favor, informe a data inicial e final do pacote.');
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      alert('A data de término deve ser posterior à data de início.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description,
        is_active: form.is_active,
        accommodations: form.accommodations.map(a => ({
          accommodation_id: a.accommodation_id,
          price_per_night: Number(a.price_per_night) || 0,
          min_nights: Math.max(1, Number(a.min_nights) || 1),
          is_active: a.is_active ? 1 : 0
        }))
      };

      if (editingPackage) {
        await api.updatePackage(editingPackage.id, payload);
      } else {
        await api.createPackage(payload);
      }
      setModalOpen(false);
      loadPackages();
    } catch (err) {
      alert(err.message || 'Erro ao salvar pacote');
    } finally {
      setSaving(false);
    }
  };

  const updateAccommodationSetting = (accId, field, value) => {
    setForm(prev => ({
      ...prev,
      accommodations: prev.accommodations.map(item => {
        if (item.accommodation_id === accId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const calculateTotalNights = (start, end) => {
    if (!start || !end) return 0;
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  };

  return (
    <div className="space-y-6">
      
      {/* Header & New Package Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Pacotes & Períodos Especiais
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {packages.length} {packages.length === 1 ? 'pacote' : 'pacotes'}
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-1">
            Configure pacotes com datas programadas (Réveillon, Carnaval, Feriados). Ao ativar, passam a valer as diárias mínimas e tarifas configuradas para cada quarto.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Pacote</span>
        </button>
      </div>

      {/* Standard Rules Explanation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Regras Padrão */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Regras Padrão de Permanência Mínima</span>
          </div>
          <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-stone-900">Loft Massambaba:</strong> Exige sempre o <span className="text-amber-700 font-bold">mínimo de 2 diárias</span> (geral, dias de semana e fins de semana).
            </li>
            <li>
              <strong className="text-stone-900">Suítes (Master, Sunset, Tropical):</strong> Exigem <span className="text-amber-700 font-bold">mínimo de 2 diárias</span> aos fins de semana (sexta e sábado).
            </li>
            <li>
              <strong className="text-stone-900">Dias de semana comuns:</strong> Suítes podem ser reservadas com apenas <span className="text-emerald-700 font-bold">1 diária</span> (domingo a quinta).
            </li>
          </ul>
        </div>

        {/* Box 2: Pacotes Ativos */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Prioridade Máxima de Pacotes Ativos</span>
          </div>
          <p className="text-xs text-amber-950/80 leading-relaxed">
            Quando o pacote da suíte ou loft estiver <strong>ativo por período programado</strong>, passa a valer automaticamente as condições do pacote até a data final configurada, sobrepondo o valor da diária e exigindo o <strong>número de diárias mínimas programado individualmente</strong> para cada acomodação.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-500 text-xs mt-3">Carregando pacotes cadastrados...</p>
        </div>
      ) : packages.length === 0 ? (
        /* Empty state */
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-4">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-stone-800">Nenhum pacote especial cadastrado</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Crie pacotes para períodos de alta procura como Réveillon, Carnaval, Páscoa ou Feriados Prolongados com exigência de diárias mínimas e tarifas diferenciadas.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Pacote</span>
          </button>
        </div>
      ) : (
        /* Packages List Cards */
        <div className="space-y-6">
          {packages.map((pkg) => {
            const isActive = Number(pkg.is_active) === 1;
            const totalNights = calculateTotalNights(pkg.start_date, pkg.end_date);

            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm hover:shadow-md ${
                  isActive ? 'border-amber-400 ring-1 ring-amber-400/20' : 'border-stone-200 opacity-90'
                }`}
              >
                {/* Package Card Header */}
                <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive ? 'bg-amber-50/50 border-amber-200/70' : 'bg-stone-50 border-stone-100'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-bold text-stone-900">
                        {pkg.name}
                      </h3>
                      {isActive ? (
                        <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pacote Ativo no Site
                        </span>
                      ) : (
                        <span className="bg-stone-200 text-stone-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Pacote Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                      <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        De {formatDate(pkg.start_date)} até {formatDate(pkg.end_date)}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span>{totalNights} noites no período programado</span>
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Switch Toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggle(pkg.id, isActive, pkg.name)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                      title={isActive ? 'Clique para desativar este pacote' : 'Clique para ativar este pacote'}
                    >
                      <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-stone-500'}`} />
                      <span>{isActive ? 'Ativo (Desativar)' : 'Inativo (Ativar)'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="p-2 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 hover:text-amber-600 transition-colors shadow-sm"
                      title="Editar Pacote e Tarifas"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      className="p-2 bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-xl border border-stone-200 transition-colors shadow-sm"
                      title="Excluir Pacote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Accommodations Grid under this Package */}
                <div className="p-6">
                  <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-stone-400" />
                    <span>Configuração de Diárias Mínimas e Valores por Acomodação</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(pkg.accommodations || []).map((acc) => {
                      const accIsActive = Number(acc.is_active) === 1;
                      return (
                        <div
                          key={acc.id || acc.accommodation_id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            accIsActive 
                              ? 'bg-stone-50/80 border-stone-200' 
                              : 'bg-stone-100/50 border-dashed border-stone-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {acc.cover_photo && (
                              <img
                                src={acc.cover_photo}
                                alt={acc.name_pt}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">
                                {acc.type === 'loft' ? 'Loft Família' : 'Suíte'}
                              </span>
                              <h5 className="font-bold text-xs text-stone-900 truncate">
                                {acc.name_pt}
                              </h5>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 text-[11px]">Mínimo exigido:</span>
                              <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md text-[11px]">
                                {acc.min_nights} {acc.min_nights === 1 ? 'noite' : 'noites'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 text-[11px]">Tarifa pacote:</span>
                              <span className="font-bold text-stone-900">
                                {formatCurrency(acc.price_per_night)} <span className="text-[10px] font-normal text-stone-500">/noite</span>
                              </span>
                            </div>

                            {acc.base_price && (
                              <div className="flex justify-between items-center text-[10px] text-stone-400 pt-0.5">
                                <span>Tarifa padrão:</span>
                                <span>{formatCurrency(acc.base_price)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Criar / Editar Pacote */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold">
                  {editingPackage ? 'Editar Pacote Especial' : 'Novo Pacote Especial'}
                </h3>
                <p className="text-stone-400 text-xs mt-0.5">
                  Defina o período, status e as diárias mínimas com tarifa de cada suíte ou loft
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Nome do Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pacote Réveillon Pé na Areia 2026/2027, Carnaval 2027..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Data Início do Pacote *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Data Término do Pacote *
                    </label>
                    <input
                      type="date"
                      required
                      min={form.start_date}
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Status de Ativação
                    </label>
                    <select
                      value={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value={1}>🟢 Ativo (Valendo no site)</option>
                      <option value={0}>⚪ Inativo (Rascunho)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Descrição e Benefícios do Pacote
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Incluso café da manhã especial, espumante pé na areia e ceia de celebração..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Accommodations Configuration Table */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Configurar Diárias Mínimas e Valor por Quarto</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Defina individualmente cada suíte e loft
                  </span>
                </div>

                <div className="space-y-3">
                  {form.accommodations.map((acc) => (
                    <div
                      key={acc.accommodation_id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        acc.is_active 
                          ? 'bg-stone-50 border-stone-200' 
                          : 'bg-stone-100/60 border-stone-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Number(acc.is_active) === 1}
                          onChange={(e) => updateAccommodationSetting(acc.accommodation_id, 'is_active', e.target.checked ? 1 : 0)}
                          className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        {acc.cover_photo && (
                          <img
                            src={acc.cover_photo}
                            alt={acc.name_pt}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div>
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            {acc.type === 'loft' ? 'Loft Família' : 'Suíte'}
                          </span>
                          <h4 className="font-bold text-xs text-stone-900">
                            {acc.name_pt}
                          </h4>
                          <span className="text-[10px] text-stone-500">
                            Padrão: {formatCurrency(acc.base_price)}/noite
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                            Diárias Mínimas
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="30"
                              disabled={!acc.is_active}
                              value={acc.min_nights}
                              onChange={(e) => updateAccommodationSetting(acc.accommodation_id, 'min_nights', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-bold text-center focus:outline-none focus:border-amber-500 disabled:bg-stone-100"
                            />
                            <span className="text-[11px] text-stone-400">noites</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                            Tarifa do Pacote (R$)
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-stone-400 font-bold">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              disabled={!acc.is_active}
                              value={acc.price_per_night}
                              onChange={(e) => updateAccommodationSetting(acc.accommodation_id, 'price_per_night', parseFloat(e.target.value) || 0)}
                              className="w-28 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-bold focus:outline-none focus:border-amber-500 disabled:bg-stone-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-stone-900 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingPackage ? 'Atualizar Pacote' : 'Salvar e Ativar Pacote'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
