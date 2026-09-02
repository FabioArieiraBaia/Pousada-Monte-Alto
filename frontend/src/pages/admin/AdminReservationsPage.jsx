import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, MessageCircle, Check, X, 
  Trash2, Filter, DollarSign, Clock, Users, PawPrint, Edit2, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState(null);

  const [form, setForm] = useState({
    accommodation_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    adults_count: 2,
    children_count: 0,
    has_pets: 0,
    total_price: 450,
    status: 'confirmed',
    payment_status: 'paid',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRes, roomsRes] = await Promise.all([
        api.getReservations(),
        api.getAccommodations(false)
      ]);
      setReservations(resRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, paymentStatus = null) => {
    try {
      await api.updateReservationStatus(id, newStatus, paymentStatus);
      loadData();
    } catch (err) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta reserva?')) return;
    try {
      await api.deleteReservation(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  const handleOpenWhatsApp = async (id) => {
    try {
      const res = await api.getWhatsAppLink(id);
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank');
      }
    } catch (err) {
      alert('Erro ao gerar link do WhatsApp');
    }
  };

  const handleSaveReservation = async (e) => {
    e.preventDefault();
    try {
      if (editingRes) {
        await api.updateReservationStatus(editingRes.id, form.status, form.payment_status, form.notes);
      } else {
        await api.createAdminReservation(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erro ao salvar reserva');
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Gestão de Reservas & Hóspedes
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Acompanhe datas, status de pagamento e confirme reservas com 1-Clique no WhatsApp.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRes(null);
            setForm({
              accommodation_id: rooms[0]?.id || '',
              guest_name: '',
              guest_email: '',
              guest_phone: '',
              check_in: new Date().toISOString().split('T')[0],
              check_out: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
              adults_count: 2,
              children_count: 0,
              has_pets: 0,
              total_price: 900,
              status: 'confirmed',
              payment_status: 'paid',
              notes: ''
            });
            setModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Reserva</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200/80 flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todas as Reservas' },
          { id: 'pending', label: 'Pendentes de Confirmação ⏳' },
          { id: 'confirmed', label: 'Confirmadas ✅' },
          { id: 'checked_in', label: 'Hóspede no Local 🏖️' },
          { id: 'checked_out', label: 'Finalizadas' },
          { id: 'cancelled', label: 'Canceladas' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab.id
                ? 'bg-stone-900 text-white shadow-sm font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-sand-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200/50">
              <tr>
                <th className="px-6 py-4">Cód & Hóspede</th>
                <th className="px-6 py-4">Acomodação</th>
                <th className="px-6 py-4">Check-in / Check-out</th>
                <th className="px-6 py-4">Pessoas & Pets</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Status Reserva</th>
                <th className="px-6 py-4 text-right">Ações & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-sand-50/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                          #{res.id}
                        </span>
                        <span>{res.guest_name}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-normal mt-0.5">
                        {res.guest_phone} {res.guest_email ? `• ${res.guest_email}` : ''}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-stone-800">
                      {res.accommodation_name || 'Suíte Pousada Monte Alto'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-800">
                        {new Date(res.check_in).toLocaleDateString('pt-BR')} até {new Date(res.check_out).toLocaleDateString('pt-BR')}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {Math.max(1, Math.round((new Date(res.check_out) - new Date(res.check_in)) / 86400000))} diárias
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>👥 {res.adults_count} adulto(s)</span>
                        {res.has_pets == 1 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <PawPrint className="w-3 h-3" /> Pet
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 font-serif text-sm">
                        {formatCurrency(res.total_price)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${
                        res.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {res.payment_status === 'paid' ? '● Pago' : '○ Não Pago'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={res.status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                          res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          res.status === 'checked_in' ? 'bg-cyan-50 text-cyan-800 border-cyan-300' :
                          res.status === 'checked_out' ? 'bg-stone-100 text-stone-700 border-stone-300' :
                          res.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="pending">⏳ Pendente</option>
                        <option value="confirmed">✅ Confirmada</option>
                        <option value="checked_in">🏖️ Check-in Ativo</option>
                        <option value="checked_out">🏁 Finalizada</option>
                        <option value="cancelled">❌ Cancelada</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsApp(res.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors"
                          title="Enviar confirmação no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-colors"
                          title="Excluir reserva"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-stone-400">
                    Nenhuma reserva encontrada para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit Reservation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100 my-8">
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  {editingRes ? 'Editar Reserva' : 'Lançamento Manual de Reserva'}
                </span>
                <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                  Dados do Hóspede e Estadia
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-full bg-stone-800 text-stone-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Acomodação *
                </label>
                <select
                  required
                  value={form.accommodation_id}
                  onChange={(e) => setForm({ ...form, accommodation_id: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name_pt} (R$ {r.base_price}/noite)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Nome do Hóspede *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.guest_phone}
                    onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Check-in *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.check_in}
                    onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Check-out *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.check_out}
                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.total_price}
                    onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Status Pagamento
                  </label>
                  <select
                    value={form.payment_status}
                    onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  >
                    <option value="paid">Pago</option>
                    <option value="unpaid">Não Pago</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  Salvar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
