import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Calendar, Trash2, ArrowUpRight, ArrowDownRight, BedDouble,
  ChevronLeft, ChevronRight, Search, Download, Printer,
  BarChart3, PieChart, Clock, MessageCircle, Sparkles,
  Zap, Utensils, Wrench, Shirt, Sparkle, Building2
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminFinancePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [summary, setSummary] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [roomBreakdown, setRoomBreakdown] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'transactions' | 'receivables' | 'rooms'
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const initialForm = {
    type: 'income',
    category: 'diaria',
    amount: '',
    payment_method: 'pix',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'completed',
    accommodation_id: '',
    checkin_date: '',
    checkout_date: '',
    nights: 1
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadAllData();
  }, [currentMonth, typeFilter]);

  useEffect(() => {
    api.getAccommodations(false).then(res => {
      if (res.data) setRooms(res.data);
    }).catch(err => console.error(err));
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, transRes, kpiRes, recRes, roomRes] = await Promise.all([
        api.getFinanceSummary(currentMonth),
        api.getFinanceTransactions(typeFilter, currentMonth),
        api.getFinanceKpis(currentMonth),
        api.getFinanceReceivables(),
        api.getFinanceByAccommodation(currentMonth)
      ]);

      setSummary(sumRes.summary || {});
      setTransactions(transRes.data || []);
      setKpis(kpiRes.kpis || {});
      setReceivables(recRes.data || []);
      setRoomBreakdown(roomRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
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

  // 1-Click Quick Presets for Common Hospitality Expenses & Incomes
  const applyQuickPreset = (preset) => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'enel') {
      setForm({
        ...initialForm,
        type: 'expense',
        category: 'energia',
        description: 'Conta de Energia Elétrica Enel (Pousada)',
        payment_method: 'pix',
        transaction_date: today
      });
    } else if (preset === 'lavanderia') {
      setForm({
        ...initialForm,
        type: 'expense',
        category: 'limpeza',
        description: 'Lavanderia, higienização e enxoval das suítes',
        payment_method: 'pix',
        transaction_date: today
      });
    } else if (preset === 'limpeza') {
      setForm({
        ...initialForm,
        type: 'expense',
        category: 'limpeza',
        description: 'Serviço de limpeza e conservação das acomodações',
        payment_method: 'pix',
        transaction_date: today
      });
    } else if (preset === 'cafe') {
      setForm({
        ...initialForm,
        type: 'expense',
        category: 'insumos',
        description: 'Compras de insumos e produtos para o café da manhã',
        payment_method: 'cartao_debito',
        transaction_date: today
      });
    } else if (preset === 'manutencao') {
      setForm({
        ...initialForm,
        type: 'expense',
        category: 'manutencao',
        description: 'Manutenção preventiva e corretiva (ar-condicionado / bombas)',
        payment_method: 'pix',
        transaction_date: today
      });
    } else if (preset === 'diaria') {
      setForm({
        ...initialForm,
        type: 'income',
        category: 'diaria',
        payment_method: 'pix',
        transaction_date: today
      });
    }
  };

  const handleLodgingChange = (field, val) => {
    const updated = { ...form, [field]: val };
    
    let nights = updated.nights || 1;
    if (updated.checkin_date && updated.checkout_date) {
      const diff = (new Date(updated.checkout_date) - new Date(updated.checkin_date)) / 86400000;
      nights = Math.max(1, Math.round(diff));
      updated.nights = nights;
    }

    const selectedRoom = rooms.find(r => String(r.id) === String(updated.accommodation_id));
    if (selectedRoom) {
      if (!updated.amount || field === 'checkin_date' || field === 'checkout_date' || field === 'accommodation_id') {
        updated.amount = (nights * selectedRoom.base_price).toFixed(2);
      }
      const datesText = (updated.checkin_date && updated.checkout_date)
        ? ` (${nights} diárias: ${new Date(updated.checkin_date + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(updated.checkout_date + 'T12:00:00').toLocaleDateString('pt-BR')})`
        : ` (${nights} diárias)`;
      if (!updated.description || updated.description.startsWith('Diária')) {
        updated.description = `Diárias ${selectedRoom.name_pt}${datesText}`;
      }
    }
    setForm(updated);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.createFinanceTransaction(form);
      setModalOpen(false);
      setForm(initialForm);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Erro ao lançar transação');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este lançamento financeiro?')) return;
    try {
      await api.deleteFinanceTransaction(id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const desc = (t.description || t.guest_name || '').toLowerCase();
    const acc = (t.accommodation_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || desc.includes(query) || acc.includes(query) || String(t.amount).includes(query);
    const matchesCat = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      
      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-stone-900">Pousada Monte Alto • Arraial do Cabo - RJ</h1>
        <p className="text-sm text-stone-600">Relatório Executivo Financeiro • Período: {formatMonthTitle(currentMonth)}</p>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Módulo Financeiro & Livro Caixa
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              Gestão Hoteleira
            </span>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Cockpit hoteleiro: faturamento, indicadores RevPAR/ADR, livro caixa e projeção de entradas.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={api.getFinanceExportCsvUrl(currentMonth)}
            download
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-colors border border-stone-200"
            title="Exportar planilha Excel (.CSV)"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </a>

          <button
            onClick={() => window.print()}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-colors border border-stone-200"
            title="Imprimir relatório executivo"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Imprimir PDF</span>
          </button>

          <button
            onClick={() => {
              setForm(initialForm);
              setModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Month Navigation Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200/80 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="font-serif font-bold text-base sm:text-lg text-stone-900">
              {formatMonthTitle(currentMonth)}
            </span>
          </div>

          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Month Jumps */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setCurrentMonth(new Date().toISOString().substring(0, 7))}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              currentMonth === new Date().toISOString().substring(0, 7)
                ? 'bg-amber-500 text-stone-950 font-bold'
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
            className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors hidden sm:inline-block"
          >
            Mês Anterior
          </button>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2 py-1 rounded-xl text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Top 4 Hospitality KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Receitas do Mês */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Receitas Realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600 block">
            {formatCurrency(kpis?.month_income ?? summary?.month_income)}
          </span>
          <div className="flex flex-col gap-0.5 text-[11px] text-stone-500">
            {kpis?.income_growth !== undefined && kpis.income_growth !== 0 && (
              <span className={`font-semibold flex items-center gap-0.5 ${kpis.income_growth > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {kpis.income_growth > 0 ? '▲ +' : '▼ '}{kpis.income_growth}% vs mês anterior
              </span>
            )}
            {kpis?.projected_income > 0 && (
              <span className="text-amber-700 font-medium">
                + {formatCurrency(kpis.projected_income)} previsto a receber
              </span>
            )}
          </div>
        </div>

        {/* 2. Despesas do Mês */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Despesas Operacionais</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-rose-600 block">
            {formatCurrency(kpis?.month_expense ?? summary?.month_expense)}
          </span>
          <span className="text-[11px] text-stone-400 block">
            Total acumulado histórico: {formatCurrency(summary?.total_expense)}
          </span>
        </div>

        {/* 3. Saldo Líquido & Margem */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Saldo Líquido</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl sm:text-3xl font-serif font-bold block ${
            (kpis?.month_balance ?? summary?.month_balance ?? 0) >= 0 ? 'text-stone-900' : 'text-rose-600'
          }`}>
            {formatCurrency(kpis?.month_balance ?? summary?.month_balance)}
          </span>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-md">
              {kpis?.profit_margin ?? 0}% margem
            </span>
            <span className="text-stone-400">lucro operacional</span>
          </div>
        </div>

        {/* 4. Métricas Hoteleiras: ADR & RevPAR */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200/80 space-y-2 relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Métricas Hoteleiras</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-stone-400 font-semibold block">Diária Média (ADR)</span>
              <span className="text-lg font-serif font-bold text-stone-900">
                {formatCurrency(kpis?.adr || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 font-semibold block">RevPAR</span>
              <span className="text-lg font-serif font-bold text-cyan-800">
                {formatCurrency(kpis?.revpar || 0)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 pt-0.5 border-t border-stone-100 flex items-center justify-between">
            <span>Ocupação do mês:</span>
            <span className="font-bold text-stone-800">{kpis?.occupancy_rate ?? 0}% ({kpis?.occupied_nights ?? 0} noites)</span>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-px print:hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visão Geral & Custos</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'transactions'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Extrato de Lançamentos ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'receivables'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Contas a Receber & Previsão ({receivables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'rooms'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Rentabilidade por Quarto</span>
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL & GRÁFICOS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Monthly Cash Flow Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Fluxo de Caixa Mensal (Últimos 6 Meses)
                </h3>
                <p className="text-stone-500 text-xs">Comparativo visual de receitas e despesas.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Receitas
                </span>
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span className="w-3 h-3 bg-rose-400 rounded-sm" /> Despesas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 pt-6 items-end h-56 border-b border-stone-100 pb-3">
              {summary?.chart_data?.map((item, idx) => {
                const maxVal = Math.max(...(summary.chart_data.map(d => Math.max(d.income, d.expense))), 1000);
                const incomeHeight = Math.min(100, Math.round((item.income / maxVal) * 100));
                const expenseHeight = Math.min(100, Math.round((item.expense / maxVal) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 w-full justify-center h-40">
                      <div
                        style={{ height: `${Math.max(8, incomeHeight)}%` }}
                        className="w-4 sm:w-6 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600"
                        title={`Receita: ${formatCurrency(item.income)}`}
                      />
                      <div
                        style={{ height: `${Math.max(5, expenseHeight)}%` }}
                        className="w-4 sm:w-6 bg-rose-400 rounded-t-lg transition-all group-hover:bg-rose-500"
                        title={`Despesa: ${formatCurrency(item.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-stone-500">{item.month_label}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-sand-50 rounded-2xl border border-amber-200/50 flex flex-wrap items-center justify-between text-xs text-stone-700">
              <span><strong>Lucro Acumulado 6 Meses:</strong> {formatCurrency(summary?.total_balance)}</span>
              <span><strong>Total Faturado no Histórico:</strong> {formatCurrency(summary?.total_income)}</span>
            </div>
          </div>

          {/* Cost Distribution (1 col) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Divisão de Custos do Mês
              </h3>
              <p className="text-stone-500 text-xs">Onde foram aplicados os recursos da pousada.</p>
            </div>

            {summary?.categories && summary.categories.filter(c => c.type === 'expense').length > 0 ? (
              <div className="space-y-3 pt-2">
                {summary.categories.filter(c => c.type === 'expense').map((cat, idx) => {
                  const totalExp = summary.month_expense || 1;
                  const pct = Math.round((cat.total / totalExp) * 100);
                  const labels = {
                    energia: '⚡ Energia / Água',
                    limpeza: '🧺 Lavanderia & Limpeza',
                    insumos: '☕ Café da Manhã',
                    manutencao: '🔧 Manutenção',
                    pessoal: '👥 Pessoal / Diaristas',
                    outros: '📦 Outros Custos'
                  };

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800">{labels[cat.category] || cat.category}</span>
                        <span className="font-bold text-stone-900">{formatCurrency(cat.total)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-rose-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-stone-400 text-xs">
                Nenhuma despesa registrada para este mês.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: EXTRATO DE LANÇAMENTOS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden space-y-4">
          
          {/* Filters & Search Header */}
          <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por descrição, hóspede, suíte ou valor..."
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  typeFilter === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Despesas
              </button>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none"
              >
                <option value="">Todas Categorias</option>
                <option value="diaria">Diárias</option>
                <option value="energia">Energia</option>
                <option value="limpeza">Limpeza / Lavanderia</option>
                <option value="insumos">Café da Manhã</option>
                <option value="manutencao">Manutenção</option>
                <option value="frigobar">Frigobar</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-sand-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200/50">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição / Hóspede</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Forma Pagamento</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-stone-500 whitespace-nowrap">
                        {new Date(t.transaction_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-stone-900">
                          {t.description || (t.guest_name ? `Reserva #${t.reservation_id} - ${t.guest_name}` : 'Lançamento')}
                        </div>
                        {t.accommodation_name && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                              <BedDouble className="w-3 h-3 text-amber-700" />
                              {t.accommodation_name}
                            </span>
                            {t.nights && (
                              <span className="bg-stone-100 text-stone-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                {t.nights} {t.nights === 1 ? 'diária' : 'diárias'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          t.type === 'income' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded text-[11px] uppercase">
                          {t.payment_method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold font-mono text-sm whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {t.type === 'income' ? '+ ' : '- '}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-400">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAS A RECEBER & PREVISÃO */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Projeção de Entradas & Reservas Confirmadas
              </h3>
              <p className="text-stone-500 text-xs">
                Contas a receber de hóspedes com reservas ativas nos próximos 30 a 60 dias.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-900 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-300">
              Total Previsto: {formatCurrency(receivables.reduce((acc, r) => acc + (Number(r.total_price) || 0), 0))}
            </span>
          </div>

          {receivables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receivables.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3 hover:border-amber-400 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{r.guest_name}</span>
                      <span className="text-[11px] text-stone-500">{r.accommodation_name}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {formatCurrency(r.total_price)}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-600 flex items-center justify-between pt-2 border-t border-stone-200">
                    <span>
                      📅 {new Date(r.check_in + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(r.check_out + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="font-semibold text-stone-700">{r.nights || 1} noites</span>
                  </div>

                  {r.guest_phone && (
                    <a
                      href={`https://wa.me/${r.guest_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${r.guest_name}! Confirmamos sua estadia na Pousada Monte Alto para ${new Date(r.check_in + 'T12:00:00').toLocaleDateString('pt-BR')}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Falar no WhatsApp</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              Nenhuma reserva futura pendente de recebimento encontrada.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RENTABILIDADE POR QUARTO */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-6 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Desempenho Financeiro por Acomodação
            </h3>
            <p className="text-stone-500 text-xs">
              Receita gerada por cada Suíte e Loft no mês de {formatMonthTitle(currentMonth)}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomBreakdown.map((room) => {
              const totalMonth = kpis?.month_income || 1;
              const sharePct = totalMonth > 0 ? Math.round((room.total_revenue / totalMonth) * 100) : 0;

              return (
                <div key={room.id} className="p-5 rounded-2xl border border-stone-200/80 bg-sand-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">{room.type}</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      {sharePct}% do faturamento
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                    {room.name_pt}
                  </h4>

                  <div>
                    <span className="text-xs text-stone-400 block">Receita no Mês</span>
                    <span className="text-2xl font-serif font-bold text-emerald-600 block">
                      {formatCurrency(room.total_revenue)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 text-xs text-stone-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Diária Base:</span>
                      <span className="font-bold">{formatCurrency(room.base_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Noites Vendidas:</span>
                      <span className="font-bold">{room.total_nights || 0} noites</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMART MODAL: NOVO LANÇAMENTO EM 1-CLIQUE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-sand-50/50">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Novo Lançamento Financeiro
                </h3>
                <p className="text-stone-500 text-xs">
                  Atalhos de 1-clique para despesas e receitas da pousada.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Preset Shortcuts */}
            <div className="p-4 bg-stone-50/80 border-b border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Atalhos Rápidos de 1-Clique:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyQuickPreset('diaria')}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100"
                >
                  <BedDouble className="w-3 h-3 text-emerald-600" /> Diária
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset('enel')}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1 hover:bg-amber-100"
                >
                  <Zap className="w-3 h-3 text-amber-600" /> Luz (Enel)
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset('lavanderia')}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 flex items-center gap-1 hover:bg-blue-100"
                >
                  <Shirt className="w-3 h-3 text-blue-600" /> Lavanderia
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset('limpeza')}
                  className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200 flex items-center gap-1 hover:bg-purple-100"
                >
                  <Sparkle className="w-3 h-3 text-purple-600" /> Faxina / Diarista
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset('cafe')}
                  className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-800 text-[11px] font-bold border border-orange-200 flex items-center gap-1 hover:bg-orange-100"
                >
                  <Utensils className="w-3 h-3 text-orange-600" /> Café da Manhã
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPreset('manutencao')}
                  className="px-2.5 py-1 rounded-xl bg-stone-200 text-stone-800 text-[11px] font-bold border border-stone-300 flex items-center gap-1 hover:bg-stone-300"
                >
                  <Wrench className="w-3 h-3 text-stone-600" /> Manutenção
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Tipo e Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Tipo de Movimentação *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'income' })}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        form.type === 'income' 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'expense' })}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        form.type === 'expense' 
                          ? 'bg-rose-600 text-white border-rose-600' 
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Categoria *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      category: newCat,
                      ...(newCat !== 'diaria' ? { accommodation_id: '', checkin_date: '', checkout_date: '', nights: 0 } : {})
                    }));
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="diaria">Diária de Hospedagem</option>
                  <option value="frigobar">Frigobar / Consumo Hóspede</option>
                  <option value="passeio">Passeio de Barco / Comissão</option>
                  <option value="energia">Energia Elétrica (Enel) / Água</option>
                  <option value="limpeza">Lavanderia & Limpeza</option>
                  <option value="manutencao">Manutenção & Reparos</option>
                  <option value="insumos">Café da Manhã / Insumos</option>
                  <option value="pessoal">Pessoal / Diárias</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              {/* Vínculo de Diária / Hospedagem */}
              {form.category === 'diaria' && (
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                      Calculadora de Diária
                    </span>
                    {form.nights > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {form.nights} {form.nights === 1 ? 'diária' : 'diárias'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Suíte ou Loft
                    </label>
                    <select
                      value={form.accommodation_id}
                      onChange={(e) => handleLodgingChange('accommodation_id', e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-stone-300 bg-white focus:outline-none"
                    >
                      <option value="">Selecione a acomodação...</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name_pt || room.name} (R$ {Number(room.base_price || 0).toFixed(2)}/noite)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Check-in</label>
                      <input
                        type="date"
                        value={form.checkin_date}
                        onChange={(e) => handleLodgingChange('checkin_date', e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-stone-300 bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Check-out</label>
                      <input
                        type="date"
                        value={form.checkout_date}
                        min={form.checkin_date || undefined}
                        onChange={(e) => handleLodgingChange('checkout_date', e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-stone-300 bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Pagamento da conta de energia elétrica Enel"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Forma de Pagamento e Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Data da Transação *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.transaction_date}
                    onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  Salvar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
