import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, MessageCircle, Check, X, 
  Trash2, Filter, DollarSign, Clock, Users, PawPrint, Edit2, AlertCircle,
  ChevronLeft, ChevronRight, Ban, RotateCcw, AlertTriangle,
  Search, LayoutGrid, CheckCircle2, TrendingUp, Sparkles, Building2, BedDouble
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('calendar'); // 'list' | 'calendar'
  const [calendarSubView, setCalendarSubView] = useState('timeline'); // 'timeline' | 'cards'
  const [roomTypeFilter, setRoomTypeFilter] = useState('all'); // 'all' | 'loft' | 'suite' | 'pet'
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRes, setHoveredRes] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState(null);

  // Cancel & Refund Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resToCancel, setResToCancel] = useState(null);
  const [cancelForm, setCancelForm] = useState({
    refund_type: 'full', // 'none' | 'full' | 'partial'
    refund_amount: 0,
    refund_reason: 'Cancelamento a pedido do hóspede',
    payment_method: 'pix'
  });
  const [submittingCancel, setSubmittingCancel] = useState(false);

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

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();

  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => {
    const day = i + 1;
    const dateObj = new Date(year, month, day);
    const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dateObj.getDay()];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, dateStr, dayOfWeek, isWeekend, isToday };
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getReservationForCell = (roomId, dateStr) => {
    return reservations.find(r => {
      if (Number(r.accommodation_id) !== Number(roomId)) return false;
      if (r.status === 'cancelled') return false;
      // Check if dateStr falls between check_in and check_out
      return dateStr >= r.check_in && dateStr < r.check_out;
    });
  };

  const handleDayClick = (roomId, dateStr) => {
    setEditingRes(null);
    const room = rooms.find(r => Number(r.id) === Number(roomId));
    const nextDay = new Date(new Date(dateStr + 'T12:00:00').getTime() + 86400000 * 2).toISOString().split('T')[0];
    const basePrice = room ? Number(room.base_price || 350) : 350;
    
    setForm({
      accommodation_id: roomId,
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: dateStr,
      check_out: nextDay,
      adults_count: 2,
      children_count: 0,
      has_pets: 0,
      total_price: basePrice * 2,
      status: 'confirmed',
      payment_status: 'paid',
      notes: ''
    });
    setModalOpen(true);
  };

  const openReservationDetails = (res) => {
    setEditingRes(res);
    setForm({
      accommodation_id: res.accommodation_id,
      guest_name: res.guest_name,
      guest_email: res.guest_email || '',
      guest_phone: res.guest_phone || '',
      check_in: res.check_in,
      check_out: res.check_out,
      adults_count: res.adults_count || 2,
      children_count: res.children_count || 0,
      has_pets: res.has_pets || 0,
      total_price: res.total_price || 0,
      status: res.status,
      payment_status: res.payment_status,
      notes: res.notes || ''
    });
    setModalOpen(true);
  };

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

  const openCancelModal = (res) => {
    setResToCancel(res);
    setCancelForm({
      refund_type: res.payment_status === 'paid' ? 'full' : 'none',
      refund_amount: res.total_price || 0,
      refund_reason: 'Cancelamento a pedido do hóspede',
      payment_method: 'pix'
    });
    setCancelModalOpen(true);
  };

  const handleStatusChange = async (id, newStatus, paymentStatus = null) => {
    if (newStatus === 'cancelled') {
      const targetRes = reservations.find(r => r.id === id);
      if (targetRes) {
        openCancelModal(targetRes);
        return;
      }
    }
    try {
      await api.updateReservationStatus(id, newStatus, paymentStatus);
      loadData();
    } catch (err) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!resToCancel) return;
    setSubmittingCancel(true);
    try {
      const res = await api.cancelReservation(resToCancel.id, cancelForm);
      alert(res.message || 'Reserva cancelada com sucesso!');
      setCancelModalOpen(false);
      setModalOpen(false); // Close edit modal if open
      loadData();
    } catch (err) {
      alert(err.message || 'Erro ao processar cancelamento e reembolso');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta reserva do histórico?')) return;
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

  // Hoje no formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Quartos ocupados hoje (com check-in ativo ou status confirmed)
  const occupiedRoomsToday = rooms.filter(room => {
    return reservations.some(r => 
      Number(r.accommodation_id) === Number(room.id) &&
      r.status !== 'cancelled' &&
      todayStr >= r.check_in && todayStr < r.check_out
    );
  });
  const freeRoomsTodayCount = Math.max(0, rooms.length - occupiedRoomsToday.length);

  // Total faturamento e reservas do mês visualizado
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthReservations = reservations.filter(r => 
    r.status !== 'cancelled' && 
    (r.check_in.startsWith(monthPrefix) || r.check_out.startsWith(monthPrefix))
  );
  const totalMonthRevenue = monthReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
  const occupancyRate = rooms.length > 0 && daysInMonthCount > 0 
    ? Math.min(100, Math.round((monthReservations.length * 3 / (rooms.length * daysInMonthCount)) * 100))
    : 0;

  // Filtragem de Quartos (Lofts, Suítes, Pet Friendly, Busca)
  const filteredRooms = rooms.filter(room => {
    const name = (room.name_pt || room.name || '').toLowerCase();
    if (roomTypeFilter === 'loft' && !name.includes('loft')) return false;
    if (roomTypeFilter === 'suite' && (!name.includes('suíte') && !name.includes('suite'))) return false;
    if (roomTypeFilter === 'pet' && room.pets_allowed != 1 && !name.includes('pet')) return false;
    
    // Se digitou busca de texto, verificar se o quarto ou alguma reserva desse quarto bate com a busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRoomName = name.includes(q);
      const matchRes = reservations.some(r => 
        Number(r.accommodation_id) === Number(room.id) &&
        r.status !== 'cancelled' &&
        ((r.guest_name || '').toLowerCase().includes(q) || 
         (r.guest_phone || '').includes(q) || 
         String(r.id) === q)
      );
      if (!matchRoomName && !matchRes) return false;
    }
    return true;
  });

  const filteredReservations = reservations
    .filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.guest_name || '').toLowerCase().includes(q);
        const matchPhone = (r.guest_phone || '').includes(q);
        const matchEmail = (r.guest_email || '').toLowerCase().includes(q);
        const matchRoom = (r.accommodation_name || '').toLowerCase().includes(q);
        const matchId = String(r.id) === q;
        if (!matchName && !matchPhone && !matchEmail && !matchRoom && !matchId) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.check_in || '';
      const dateB = b.check_in || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (b.id || 0) - (a.id || 0);
    });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Gestão de Reservas & Calendário
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Mapa de ocupação em tempo real, cotação instantânea de diárias e confirmação via WhatsApp.
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
              check_out: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              adults_count: 2,
              children_count: 0,
              has_pets: 0,
              total_price: (rooms[0]?.base_price || 350) * 2,
              status: 'confirmed',
              payment_status: 'paid',
              notes: ''
            });
            setModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Reserva</span>
        </button>
      </div>

      {/* KPI Cards: Visão Rápida da Pousada */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">LIVRES HOJE</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
              {freeRoomsTodayCount} <span className="text-xs font-sans text-stone-400 font-normal">de {rooms.length}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Disponíveis agora
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🟢
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">OCUPADOS HOJE</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
              {occupiedRoomsToday.length} <span className="text-xs font-sans text-stone-400 font-normal">hóspedes</span>
            </div>
            <span className="text-[11px] text-rose-600 font-semibold block mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Na Pousada agora
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            🔴
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">OCUPAÇÃO DO MÊS</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
              {occupancyRate}%
            </div>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-600" /> {monthReservations.length} reservas no mês
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            📊
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">RECEITA PREVISTA</span>
            <div className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 truncate max-w-[150px]">
              {formatCurrency(totalMonthRevenue)}
            </div>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1 truncate capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            💰
          </div>
        </div>
      </div>

      {/* Main Controls & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
        
        {/* Top Control Line: Search & Primary View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por hóspede, telefone, suíte ou loft..."
              className="w-full text-xs p-3 pl-10 rounded-2xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-stone-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Calendar vs List */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendário</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Month Navigator (visible when in calendar mode) */}
            {viewMode === 'calendar' && (
              <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-2xl border border-stone-200">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-xl hover:bg-stone-200 text-stone-700 transition-colors"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-stone-900 capitalize px-2 min-w-[130px] text-center">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-xl hover:bg-stone-200 text-stone-700 transition-colors"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-stone-900 px-2 py-1 rounded-lg transition-colors ml-1"
                >
                  Hoje
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills: Lofts, Suítes, Pet Friendly, Sub-views */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Room Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-400 mr-1 uppercase">Filtrar:</span>
            {[
              { id: 'all', label: 'Todos os Quartos', icon: Building2 },
              { id: 'loft', label: 'Apenas Lofts 🏡', icon: BedDouble },
              { id: 'suite', label: 'Apenas Suítes 🌊', icon: BedDouble },
              { id: 'pet', label: 'Pet Friendly 🐾', icon: PawPrint }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoomTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  roomTypeFilter === tab.id
                    ? 'bg-stone-900 text-white font-bold shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-view switcher inside Calendar mode */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setCalendarSubView('timeline')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  calendarSubView === 'timeline'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>Linha do Tempo (Gantt)</span>
              </button>
              <button
                onClick={() => setCalendarSubView('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  calendarSubView === 'cards'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards por Quarto</span>
              </button>
            </div>
          )}

          {/* Status filter in List mode */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'pending', label: 'Pendentes ⏳' },
                { id: 'confirmed', label: 'Confirmadas ✅' },
                { id: 'checked_in', label: 'No Local 🏖️' },
                { id: 'checked_out', label: 'Finalizadas' },
                { id: 'cancelled', label: 'Canceladas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-stone-900 text-white font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          1. TIMELINE MATRIX (CALENDAR VIEW)
      ======================================================== */}
      {viewMode === 'calendar' && calendarSubView === 'timeline' && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
          
          {/* Enhanced Color Legend & Tooltip Hint */}
          <div className="p-4 bg-stone-50/80 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 🟢 Livre (com valor)
              </span>
              <span className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 🟡 Pendente (Aguardando PIX)
              </span>
              <span className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> 🔵 Confirmada (Garantida)
              </span>
              <span className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px] bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> 🔴 No Local (Check-in Ativo)
              </span>
            </div>

            <span className="text-stone-500 text-[11px] font-medium bg-white px-3 py-1 rounded-full border border-stone-200">
              💡 <strong>Clique no dia verde</strong> para agendar com o quarto já selecionado!
            </span>
          </div>

          {/* Timeline Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-sand-50/90 border-b border-stone-200/80">
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-stone-700 sticky left-0 bg-stone-100 z-20 min-w-[210px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Acomodação ({filteredRooms.length})
                  </th>
                  {daysInMonth.map(dayObj => (
                    <th
                      key={dayObj.day}
                      className={`p-1 text-center min-w-[42px] max-w-[48px] border-l border-stone-200/50 text-[10px] ${
                        dayObj.isWeekend ? 'bg-amber-50/60 font-bold' : 'text-stone-600'
                      } ${dayObj.isToday ? 'bg-amber-200/60 text-amber-950 font-black' : ''}`}
                    >
                      <div className="text-[9px] uppercase text-stone-400 font-semibold">{dayObj.dayOfWeek}</div>
                      <div className={`text-xs mt-0.5 ${
                        dayObj.isToday ? 'bg-amber-500 text-stone-950 font-black rounded-full w-5 h-5 mx-auto flex items-center justify-center shadow-xs' : ''
                      }`}>
                        {dayObj.day}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRooms.map(room => (
                  <tr key={room.id} className="hover:bg-sand-50/30 transition-colors">
                    
                    {/* Room Info Sticky Cell */}
                    <td className="p-3 sticky left-0 bg-white z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      <div className="font-bold text-xs text-stone-900 truncate max-w-[195px] flex items-center gap-1.5">
                        <span className="truncate">{room.name_pt || room.name}</span>
                        {room.pets_allowed == 1 && <PawPrint className="w-3 h-3 text-emerald-600 shrink-0" title="Pet Friendly" />}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5 font-medium">
                        <span className="text-emerald-700 font-bold">R$ {room.base_price}/noite</span>
                        <span>•</span>
                        <span>Até {room.max_guests} pess.</span>
                      </div>
                    </td>

                    {/* Days Cells */}
                    {daysInMonth.map(dayObj => {
                      const res = getReservationForCell(room.id, dayObj.dateStr);

                      if (res) {
                        const isStart = res.check_in === dayObj.dateStr;
                        const isEnd = res.check_out === dayObj.dateStr;

                        const badgeColor = 
                          res.status === 'checked_in' ? 'bg-rose-500 text-white shadow-xs' :
                          res.status === 'confirmed' ? 'bg-blue-600 text-white shadow-xs' :
                          res.status === 'pending' ? 'bg-amber-400 text-stone-950 font-black' :
                          'bg-stone-400 text-white';

                        return (
                          <td
                            key={dayObj.day}
                            onClick={() => openReservationDetails(res)}
                            onMouseEnter={() => setHoveredRes(res)}
                            onMouseLeave={() => setHoveredRes(null)}
                            title={`Reserva #${res.id} - ${res.guest_name} (${res.check_in} a ${res.check_out}) • R$ ${res.total_price}`}
                            className="p-0.5 text-center border-l border-stone-200/30 cursor-pointer group relative"
                          >
                            <div className={`h-9 flex items-center justify-center text-[10px] font-bold px-1 transition-all group-hover:scale-105 group-hover:brightness-110 ${badgeColor} ${
                              isStart ? 'rounded-l-xl' : ''
                            } ${isEnd ? 'rounded-r-xl' : ''}`}>
                              {isStart ? (
                                <span className="truncate max-w-[70px] text-[10px] flex items-center gap-1 font-bold">
                                  {res.status === 'checked_in' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                                  {res.guest_name.split(' ')[0]}
                                </span>
                              ) : (
                                <span className="text-[8px] opacity-75">●</span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // 🟢 Célula Livre (Verde Esmeralda Nítido com Preço da Diária e Clique)
                      return (
                        <td
                          key={dayObj.day}
                          onClick={() => handleDayClick(room.id, dayObj.dateStr)}
                          title={`🟢 Livre em ${dayObj.day}/${month + 1} - R$ ${room.base_price}/noite. Clique para agendar!`}
                          className="p-0.5 text-center border-l border-emerald-100/70 cursor-pointer bg-emerald-50/50 hover:bg-emerald-100/80 transition-all group"
                        >
                          <div className="h-9 rounded-xl border border-emerald-200/60 hover:border-emerald-500 flex flex-col items-center justify-center text-emerald-800 transition-all hover:scale-105 shadow-2xs">
                            <span className="text-[9px] font-bold leading-tight">
                              R${room.base_price}
                            </span>
                            <span className="text-[8px] font-bold text-emerald-600 group-hover:text-emerald-800">
                              + Livre
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Hover Tooltip Bar */}
          {hoveredRes && (
            <div className="bg-stone-900 text-white p-3 px-6 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 animate-fade-in text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-amber-400">
                  #{hoveredRes.id}
                </span>
                <span className="font-bold text-sm text-white">
                  {hoveredRes.guest_name}
                </span>
                <span className="text-stone-400">
                  {hoveredRes.guest_phone}
                </span>
                <span className="text-stone-400">
                  • {hoveredRes.check_in} até {hoveredRes.check_out}
                </span>
                <span className="text-amber-400 font-bold">
                  {formatCurrency(hoveredRes.total_price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenWhatsApp(hoveredRes.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => openReservationDetails(hoveredRes)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-3 py-1 rounded-xl text-xs transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          2. ROOM CARDS VIEW (CARDS POR QUARTO - VISÃO RÁPIDA)
      ======================================================== */}
      {viewMode === 'calendar' && calendarSubView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => {
            const isOccupiedToday = reservations.some(r => 
              Number(r.accommodation_id) === Number(room.id) &&
              r.status !== 'cancelled' &&
              todayStr >= r.check_in && todayStr < r.check_out
            );
            const activeResToday = reservations.find(r => 
              Number(r.accommodation_id) === Number(room.id) &&
              r.status !== 'cancelled' &&
              todayStr >= r.check_in && todayStr < r.check_out
            );

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Room Card Header */}
                <div className="p-5 border-b border-stone-100 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                        R$ {room.base_price}/diária • Até {room.max_guests} pessoas
                      </span>
                      <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">
                        {room.name_pt || room.name}
                      </h3>
                    </div>

                    {/* Today Badge */}
                    {isOccupiedToday ? (
                      <span className="shrink-0 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> 🔴 Ocupado
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> 🟢 Livre Hoje
                      </span>
                    )}
                  </div>

                  {activeResToday && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-rose-900 block truncate">
                        👤 Hóspede: {activeResToday.guest_name}
                      </span>
                      <span className="text-rose-700 text-[11px] block">
                        Saída prevista: {activeResToday.check_out} ({activeResToday.guest_phone})
                      </span>
                    </div>
                  )}
                </div>

                {/* Month Days Overview in Pills */}
                <div className="p-5 space-y-3 bg-stone-50/50">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-bold">
                    <span>Ocupação em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}:</span>
                    <span>Clique em qualquer dia</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {daysInMonth.map(dayObj => {
                      const res = getReservationForCell(room.id, dayObj.dateStr);
                      if (res) {
                        const bgCol = 
                          res.status === 'checked_in' ? 'bg-rose-500 text-white' :
                          res.status === 'confirmed' ? 'bg-blue-600 text-white' :
                          res.status === 'pending' ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-stone-400 text-white';
                        return (
                          <button
                            key={dayObj.day}
                            onClick={() => openReservationDetails(res)}
                            title={`Reserva #${res.id}: ${res.guest_name}`}
                            className={`h-7 rounded-lg text-[10px] font-bold ${bgCol} flex items-center justify-center hover:scale-110 transition-transform`}
                          >
                            {dayObj.day}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={dayObj.day}
                          onClick={() => handleDayClick(room.id, dayObj.dateStr)}
                          title={`Disponível no dia ${dayObj.day} - R$ ${room.base_price}`}
                          className="h-7 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-200 text-emerald-800 border border-emerald-200/70 flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          {dayObj.day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 border-t border-stone-100 bg-white">
                  <button
                    onClick={() => handleDayClick(room.id, todayStr)}
                    className="w-full py-2.5 bg-stone-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nova Reserva neste Quarto</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-sand-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200/50">
                <tr>
                  <th className="px-6 py-4">Cód & Hóspede</th>
                  <th className="px-6 py-4">Acomodação</th>
                  <th className="px-6 py-4">Check-in / Check-out</th>
                  <th className="px-6 py-4">Pessoas & Pets</th>
                  <th className="px-6 py-4">Valor Total & Financeiro</th>
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
                          {new Date(res.check_in + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(res.check_out + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {Math.max(1, Math.round((new Date(res.check_out + 'T12:00:00') - new Date(res.check_in + 'T12:00:00')) / 86400000))} diárias
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase ${
                            res.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {res.payment_status === 'paid' ? '● Pago' : '○ Não Pago'}
                          </span>
                          {res.is_in_finance > 0 && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200" title="Lançado no Módulo Financeiro">
                              Financeiro ✓
                            </span>
                          )}
                        </div>
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
                            onClick={() => openReservationDetails(res)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-xl transition-colors"
                            title="Editar dados da reserva"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {res.status !== 'cancelled' && (
                            <button
                              onClick={() => openCancelModal(res)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl transition-colors"
                              title="Cancelar Reserva & Reembolso"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenWhatsApp(res.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors"
                            title="Enviar mensagem no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(res.id)}
                            className="bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-700 p-2 rounded-xl transition-colors"
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
      )}

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

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
                {editingRes && editingRes.status !== 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => {
                      openCancelModal(editingRes);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancelar Reserva</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider"
                  >
                    Salvar Reserva
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 MODAL DE CANCELAMENTO & REEMBOLSO (PARCIAL OU TOTAL) 🔴 */}
      {cancelModalOpen && resToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-rose-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-800/80 flex items-center justify-center text-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-rose-300 font-bold uppercase tracking-widest block">
                    Gestão de Cancelamento
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Cancelar Reserva #{resToCancel.id}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setCancelModalOpen(false)} 
                className="p-1.5 rounded-full bg-rose-800 hover:bg-rose-700 text-rose-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-5">
              {/* Summary Card */}
              <div className="p-3.5 bg-sand-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Hóspede: {resToCancel.guest_name}</span>
                  <span className="text-amber-700 font-mono">R$ {Number(resToCancel.total_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Acomodação: {resToCancel.accommodation_name || 'Acomodação'}</span>
                  <span className={`font-semibold uppercase ${
                    resToCancel.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {resToCancel.payment_status === 'paid' ? '● Pago' : '○ Não Pago'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Período: {new Date(resToCancel.check_in + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(resToCancel.check_out + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Refund Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">
                  Política / Tipo de Reembolso *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'full', label: 'Reembolso Total', desc: '100% do valor' },
                    { id: 'partial', label: 'Reembolso Parcial', desc: 'Valor personalizado' },
                    { id: 'none', label: 'Sem Reembolso', desc: 'Taxa / No-show' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setCancelForm(prev => ({
                          ...prev,
                          refund_type: tab.id,
                          refund_amount: tab.id === 'full' 
                            ? Number(resToCancel.total_price) 
                            : tab.id === 'none' ? 0 : Number(resToCancel.total_price) * 0.5
                        }));
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        cancelForm.refund_type === tab.id
                          ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-sm'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span className={`block text-xs font-bold ${
                        cancelForm.refund_type === tab.id ? 'text-rose-900' : 'text-stone-800'
                      }`}>
                        {tab.label}
                      </span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        {tab.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Amount & Method for Refunds */}
              {cancelForm.refund_type !== 'none' && (
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                        Valor a Reembolsar (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={resToCancel.total_price}
                        required
                        disabled={cancelForm.refund_type === 'full'}
                        value={cancelForm.refund_amount}
                        onChange={(e) => setCancelForm({ ...cancelForm, refund_amount: Number(e.target.value) })}
                        className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none font-bold ${
                          cancelForm.refund_type === 'full' 
                            ? 'border-stone-200 text-stone-500 cursor-not-allowed bg-stone-100' 
                            : 'border-rose-300 text-rose-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                        Forma de Devolução
                      </label>
                      <select
                        value={cancelForm.payment_method}
                        onChange={(e) => setCancelForm({ ...cancelForm, payment_method: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none"
                      >
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência Bancária</option>
                        <option value="cartao_credito">Estorno no Cartão</option>
                        <option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-rose-800/80 flex items-center gap-1.5 font-medium">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Será lançado automaticamente um débito/despesa de <strong>R$ {Number(cancelForm.refund_amount).toFixed(2)}</strong> na categoria <em>Reembolso</em> no módulo financeiro.
                    </span>
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Motivo do Cancelamento
                </label>
                <input
                  type="text"
                  required
                  value={cancelForm.refund_reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, refund_reason: e.target.value })}
                  placeholder="Ex: Imprevisto de saúde / Pedido do hóspede / Condições climáticas"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={submittingCancel}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{submittingCancel ? 'Processando...' : 'Confirmar Cancelamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
