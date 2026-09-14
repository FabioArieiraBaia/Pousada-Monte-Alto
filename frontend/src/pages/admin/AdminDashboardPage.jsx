import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BedDouble, Calendar, DollarSign, Users, 
  MessageCircle, ArrowUpRight, ArrowDownRight, Plus, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, Sparkles, Video, Bot,
  ChevronLeft, ChevronRight, RefreshCw, LogIn, LogOut, CheckCheck,
  UserCheck, Compass, ExternalLink, ShieldCheck, Phone
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [activeTabOperations, setActiveTabOperations] = useState('checkins'); // checkins | checkouts | staying

  useEffect(() => {
    loadDashboardData();
  }, [currentMonth]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardOverview(currentMonth);
      if (res && res.success) {
        setData(res);
      } else {
        // Fallback to separate endpoints if needed
        const [roomsRes, resRes, finRes] = await Promise.all([
          api.getAccommodations(false).catch(() => ({ data: [] })),
          api.getReservations().catch(() => ({ data: [] })),
          api.getFinanceSummary(currentMonth).catch(() => ({ summary: {} }))
        ]);
        const allRes = resRes.data || [];
        setData({
          success: true,
          selected_month: currentMonth,
          finance: {
            month_income: finRes.summary?.month_income || 0,
            month_expense: finRes.summary?.month_expense || 0,
            month_balance: finRes.summary?.month_balance || 0,
            profit_margin: finRes.summary?.month_income > 0 
              ? Math.round(((finRes.summary?.month_balance || 0) / finRes.summary.month_income) * 100) 
              : 0,
            growth_percentage: 0,
            adr: 0,
            revpar: 0,
            occupancy_rate: 0
          },
          today_operations: {
            total_rooms: (roomsRes.data || []).length,
            occupied_today: 0,
            vacant_today: (roomsRes.data || []).length,
            checkins_today: [],
            checkouts_today: [],
            staying_today: []
          },
          room_rack: (roomsRes.data || []).map(r => ({
            id: r.id,
            name: r.name_pt,
            type: r.type,
            base_price: r.base_price,
            status: 'vacant',
            cover_photo: r.photos?.[0]?.photo_url || null
          })),
          ai_concierge: {
            is_active: true,
            agent_name: 'Marina - Concierge Monte Alto',
            leads_month: 0,
            pending_leads: 0,
            recent_leads: []
          },
          chart_data: finRes.summary?.chart_data || [],
          reservations: {
            total_count: allRes.length,
            pending_count: allRes.filter(r => r.status === 'pending').length,
            confirmed_count: allRes.filter(r => r.status === 'confirmed').length,
            recent: allRes.slice(0, 6)
          }
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newYm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newYm);
  };

  const formatMonthTitle = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)} de ${y}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Confirmada</span>;
      case 'checked_in':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Hóspede no Local</span>;
      case 'checked_out':
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Finalizada</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Cancelada</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pendente</span>;
    }
  };

  const getRoomStatusPill = (status) => {
    switch (status) {
      case 'occupied':
        return <span className="bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Ocupado</span>;
      case 'checkin_today':
        return <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">Chegando Hoje</span>;
      case 'checkout_today':
        return <span className="bg-cyan-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Saindo Hoje</span>;
      default:
        return <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Livre / Disponível</span>;
    }
  };

  const finance = data?.finance || {};
  const todayOps = data?.today_operations || {};
  const roomRack = data?.room_rack || [];
  const aiConcierge = data?.ai_concierge || {};
  const chartData = data?.chart_data || [];
  const reservations = data?.reservations || {};
  const recentReservations = reservations.recent || [];

  const filteredReservations = recentReservations.filter(r => {
    if (selectedStatusFilter === 'all') return true;
    return r.status === selectedStatusFilter;
  });

  const maxChartValue = Math.max(...chartData.map(c => Math.max(c.income, c.expense)), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* 1. TOP HEADER & COCKPIT ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/70 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase">
              Cockpit Executivo & Operações
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Sistema Online
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Visão Geral da Pousada
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Monte Alto • Arraial do Cabo • Monitoramento em tempo real de hospedagem, faturamento e vendas IA.
          </p>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadDashboardData()}
            title="Atualizar dados agora"
            className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <Link
            to="/admin/reservas"
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva</span>
          </Link>

          <Link
            to="/admin/financeiro"
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Novo Lançamento</span>
          </Link>

          <Link
            to="/admin/ia"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-all border border-stone-200"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Concierge IA</span>
          </Link>

          <Link
            to="/"
            target="_blank"
            className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-sm"
            title="Abrir Site Público"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. MONTH SELECTOR (Synchronized with Finance) */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="font-serif font-bold text-stone-900 text-base sm:text-lg">
              {formatMonthTitle(currentMonth)}
            </span>
          </div>

          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentMonth(new Date().toISOString().substring(0, 7))}
            className={`px-3 py-1.5 rounded-xl transition-colors font-semibold ${
              currentMonth === new Date().toISOString().substring(0, 7)
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setMonth(d.getMonth() - 1);
              setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }}
            className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors hidden sm:inline-block font-semibold"
          >
            Mês Anterior
          </button>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-1 rounded-xl text-xs focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3. FOUR STRATEGIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Receita do Mês */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Receitas Realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600 block">
            {formatCurrency(finance.month_income)}
          </span>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
            <span className="text-stone-500">
              Saldo: <strong className="text-stone-800">{formatCurrency(finance.month_balance)}</strong>
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
              {finance.profit_margin}% margem
            </span>
          </div>
        </div>

        {/* KPI 2: Ocupação & Diária Média (ADR) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Métricas Hoteleiras</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 block">
                {finance.occupancy_rate}%
              </span>
              <span className="text-[11px] text-stone-400">Ocupação do mês</span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-serif font-bold text-stone-900 block">
                {formatCurrency(finance.adr)}
              </span>
              <span className="text-[11px] text-stone-400">Diária Média (ADR)</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
            <span>RevPAR: <strong>{formatCurrency(finance.revpar)}</strong></span>
            <span className="text-stone-400">{todayOps.total_rooms || 4} acomodações</span>
          </div>
        </div>

        {/* KPI 3: Status Operacional de Hoje */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Hoje na Pousada</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-indigo-600 block">
                {todayOps.occupied_today ?? 0} <span className="text-sm font-sans font-normal text-stone-400">/ {todayOps.total_rooms ?? 4}</span>
              </span>
              <span className="text-[11px] text-stone-400">Quartos ocupados hoje</span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-serif font-bold text-emerald-600 block">
                {todayOps.vacant_today ?? 4}
              </span>
              <span className="text-[11px] text-stone-400">Quartos livres</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
            <span className="text-amber-600 font-semibold">
              Chegando: {(todayOps.checkins_today || []).length}
            </span>
            <span className="text-cyan-600 font-semibold">
              Saindo: {(todayOps.checkouts_today || []).length}
            </span>
          </div>
        </div>

        {/* KPI 4: Concierge IA Marina & Leads */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Concierge IA & Leads</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-600 block">
                {aiConcierge.leads_month || 0}
              </span>
              <span className="text-[11px] text-stone-400">Leads captados no mês</span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-serif font-bold text-rose-600 block">
                {reservations.pending_count || 0}
              </span>
              <span className="text-[11px] text-stone-400">Pendentes confirmação</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Marina Ativa (Gemini)
            </span>
            <Link to="/admin/ia" className="text-amber-600 hover:text-amber-700 font-bold">
              Ver Radar &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* 4. TODAY'S OPERATIONS & RECEPTION BOARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Painel da Recepção • Hoje ({new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })})
              </h3>
            </div>
            <p className="text-stone-500 text-xs mt-0.5">
              Acompanhamento operacional imediato de entradas, saídas e hóspedes presentes na Pousada Monte Alto.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-200/60 p-1 rounded-2xl text-xs">
            <button
              onClick={() => setActiveTabOperations('checkins')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTabOperations === 'checkins'
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-500" />
              <span>Check-ins ({(todayOps.checkins_today || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTabOperations('checkouts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTabOperations === 'checkouts'
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-cyan-600" />
              <span>Check-outs ({(todayOps.checkouts_today || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTabOperations('staying')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTabOperations === 'staying'
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>No Local ({(todayOps.staying_today || []).length})</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTabOperations === 'checkins' && (
            <div>
              {(todayOps.checkins_today || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayOps.checkins_today.map(res => (
                    <div key={res.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-sm">{res.guest_name}</span>
                          <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                            Entrada Hoje
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-1">
                          {res.accommodation_name || 'Suíte Monte Alto'}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {res.check_in} até {res.check_out} ({Math.max(1, Math.round((new Date(res.check_out) - new Date(res.check_in)) / 86400000))} diárias)
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                        <span className="font-bold text-stone-900 text-xs">{formatCurrency(res.total_price)}</span>
                        <a
                          href={`https://wa.me/${res.guest_phone?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(res.guest_name)}!%20Sua%20su%C3%ADte%20na%20Pousada%20Monte%20Alto%20est%C3%A1%20sendo%20preparada%20com%20todo%20carinho%20para%20sua%20chegada%20hoje.%20Qualquer%20d%C3%BAvida%20estamos%20%C3%A0%20disposi%C3%A7%C3%A3o!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Boas-Vindas</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs">
                  <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  Nenhum check-in previsto para hoje. Todos os hóspedes esperados já deram entrada ou o dia está livre.
                </div>
              )}
            </div>
          )}

          {activeTabOperations === 'checkouts' && (
            <div>
              {(todayOps.checkouts_today || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayOps.checkouts_today.map(res => (
                    <div key={res.id} className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/70 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-sm">{res.guest_name}</span>
                          <span className="text-[10px] font-bold uppercase bg-cyan-200/80 text-cyan-900 px-2 py-0.5 rounded-full">
                            Saída Hoje
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-1">
                          {res.accommodation_name}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Horário limite de check-out: 11:00h
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-cyan-100">
                        <span className="font-bold text-stone-900 text-xs">{formatCurrency(res.total_price)}</span>
                        <a
                          href={`https://wa.me/${res.guest_phone?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(res.guest_name)}!%20Agradecemos%20muito%20pela%20sua%20hospedagem%20na%20Pousada%20Monte%20Alto.%20Esperamos%20que%20tenha%20tenha%20sido%20uma%20experi%C3%AAncia%20inesquec%C3%ADvel!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Agradecer Hóspede</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs">
                  <CheckCheck className="w-8 h-8 text-cyan-500 mx-auto mb-2 opacity-80" />
                  Nenhum check-out agendado para o dia de hoje.
                </div>
              )}
            </div>
          )}

          {activeTabOperations === 'staying' && (
            <div>
              {(todayOps.staying_today || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayOps.staying_today.map(res => (
                    <div key={res.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-sm">{res.guest_name}</span>
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Hospedado
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-1">
                          {res.accommodation_name}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Estadia: {res.check_in} até {res.check_out}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                        <span className="text-[11px] text-stone-500">{res.guest_phone}</span>
                        <a
                          href={`https://wa.me/${res.guest_phone?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(res.guest_name)},%20tudo%20bem?%20Estamos%20%C3%A0%20disposi%C3%A7%C3%A3o%20na%20recep%C3%A7%C3%A3o%20da%20Pousada%20Monte%20Alto%20se%20precisar%20de%20algo.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs">
                  <BedDouble className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  Nenhum hóspede registrado como presente no momento.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. ROOM RACK VISUAL (STATUS REAL-TIME DAS 4 SUÍTES) */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Rack de Acomodações • Status em Tempo Real
              </h3>
            </div>
            <p className="text-stone-500 text-xs mt-0.5">
              Visão instantânea de disponibilidade das 4 suítes e lofts da pousada.
            </p>
          </div>
          <Link
            to="/admin/acomodacoes"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Gerenciar Acomodações</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roomRack.map(acc => (
            <div
              key={acc.id}
              className="bg-stone-50/70 border border-stone-200/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="relative h-32 bg-stone-200">
                {acc.cover_photo ? (
                  <img
                    src={acc.cover_photo}
                    alt={acc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <BedDouble className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  {getRoomStatusPill(acc.status)}
                </div>
                {acc.accepts_pets && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                    🐾 Pet Friendly
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm line-clamp-1">
                    {acc.name}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Até {acc.max_guests} hóspedes • {formatCurrency(acc.base_price)}/diária
                  </p>
                </div>

                {acc.current_guest ? (
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-[11px] space-y-1">
                    <div className="font-bold text-stone-900 line-clamp-1">
                      {acc.current_guest.name}
                    </div>
                    <div className="text-stone-500 text-[10px]">
                      {acc.current_guest.check_in} &rarr; {acc.current_guest.check_out}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-emerald-700 font-medium text-center">
                    Disponível para reservas imediatas
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200/50 flex items-center justify-between">
                  <Link
                    to={`/admin/reservas`}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700"
                  >
                    + Lançar Reserva
                  </Link>
                  <Link
                    to={`/admin/acomodacoes`}
                    className="text-[11px] text-stone-400 hover:text-stone-700"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. CONCIERGE IA RADAR & CASHFLOW CHART (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (1 Col): Radar Concierge IA Marina */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Radar Concierge IA
                  </h3>
                  <p className="text-[11px] text-stone-400">Marina atendendo 24h no site</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Google Gemini
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl text-xs">
                <span className="text-stone-600 font-medium">Leads Qualificados no Mês</span>
                <span className="font-bold text-amber-600 text-sm">{aiConcierge.leads_month || 0}</span>
              </div>
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl text-xs">
                <span className="text-stone-600 font-medium">Aguardando Contato WhatsApp</span>
                <span className="font-bold text-rose-600 text-sm">{aiConcierge.pending_leads || 0}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Últimos Leads Captados
              </h4>
              {(aiConcierge.recent_leads || []).length > 0 ? (
                <div className="space-y-2">
                  {aiConcierge.recent_leads.map(lead => (
                    <div key={lead.id} className="p-2.5 rounded-xl border border-stone-100 bg-sand-50/40 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">{lead.name}</div>
                        <div className="text-[10px] text-stone-400">
                          {lead.accommodation_name || 'Interesse em Hospedagem'}
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${lead.whatsapp?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(lead.name)}!%20Sou%20da%20Pousada%20Monte%20Alto.%20A%20Marina%20me%20passou%20seu%20interesse%20em%20nosso%20para%C3%ADso%20em%20Arraial%20do%20Cabo!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chamar</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-xs text-center py-4">
                  Nenhum lead registrado recentemente.
                </p>
              )}
            </div>
          </div>

          <Link
            to="/admin/ia"
            className="mt-4 w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-xl text-xs text-center transition-colors block"
          >
            Gerenciar Marina & Chaves Gemini &rarr;
          </Link>
        </div>

        {/* Right (2 Cols): Cashflow Chart (6 Months) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-stone-200/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Fluxo de Caixa & Desempenho (Últimos 6 Meses)
                </h3>
                <p className="text-[11px] text-stone-400">
                  Comparativo de receitas realizadas vs despesas operacionais da pousada.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" /> Receitas
                </span>
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <span className="w-3 h-3 rounded-md bg-rose-400" /> Despesas
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 h-48 items-end pt-4 px-2">
              {chartData.map((item, idx) => {
                const incHeight = maxChartValue > 0 ? Math.round((item.income / maxChartValue) * 100) : 0;
                const expHeight = maxChartValue > 0 ? Math.round((item.expense / maxChartValue) * 100) : 0;
                const isSelected = item.month === currentMonth;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        className={`w-1/2 rounded-t-lg transition-all ${
                          isSelected ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                        }`}
                        title={`Receitas em ${item.month_label}: ${formatCurrency(item.income)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        className={`w-1/2 rounded-t-lg transition-all ${
                          isSelected ? 'bg-rose-400 shadow-sm' : 'bg-rose-300/80 group-hover:bg-rose-400'
                        }`}
                        title={`Despesas em ${item.month_label}: ${formatCurrency(item.expense)}`}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-2 font-medium ${
                      isSelected ? 'text-stone-950 font-bold underline' : 'text-stone-400'
                    }`}>
                      {item.month_label}
                    </span>
                    <span className="text-[9px] text-stone-500 hidden sm:block">
                      {formatCurrency(item.net)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Lucro Acumulado (6 Meses): <strong className="text-stone-900">{formatCurrency(chartData.reduce((acc, c) => acc + c.net, 0))}</strong></span>
            <Link to="/admin/financeiro" className="text-amber-600 hover:text-amber-700 font-bold">
              Ver Livro Caixa Completo &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* 7. RECENT RESERVATIONS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Últimas Reservas e Solicitações
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Gerencie hóspedes, confirme reservas e dispare mensagens via WhatsApp com 1 clique.
            </p>
          </div>

          {/* Filter badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'pending', label: 'Pendentes' },
              { key: 'confirmed', label: 'Confirmadas' },
              { key: 'checked_in', label: 'No Local' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setSelectedStatusFilter(f.key)}
                className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                  selectedStatusFilter === f.key
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <Link
              to="/admin/reservas"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 ml-2"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200/50">
              <tr>
                <th className="px-6 py-3.5">Hóspede</th>
                <th className="px-6 py-3.5">Acomodação</th>
                <th className="px-6 py-3.5">Período</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-sand-50/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      <div>{res.guest_name}</div>
                      <div className="text-[11px] text-stone-400 font-normal">{res.guest_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-stone-800">{res.accommodation_name || 'Suíte Monte Alto'}</span>
                      <div className="text-[10px] text-stone-400 capitalize">{res.accommodation_type || 'Suíte'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {new Date(res.check_in).toLocaleDateString('pt-BR')} até {new Date(res.check_out).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {Math.max(1, Math.round((new Date(res.check_out) - new Date(res.check_in)) / 86400000))} noites
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900 text-sm">
                      {formatCurrency(res.total_price)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://wa.me/${res.guest_phone?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(res.guest_name)}!%20Falamos%20da%20Pousada%20Monte%20Alto%20sobre%20sua%20reserva%20para%20${encodeURIComponent(res.accommodation_name || 'a suíte')}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-400">
                    Nenhuma reserva encontrada com o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}