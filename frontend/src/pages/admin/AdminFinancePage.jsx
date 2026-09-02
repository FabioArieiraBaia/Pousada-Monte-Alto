import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Filter, Calendar, Trash2, ArrowUpRight, ArrowDownRight, Tag
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminFinancePage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'income',
    category: 'diaria',
    amount: '',
    payment_method: 'pix',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'completed'
  });

  useEffect(() => {
    loadFinanceData();
  }, [typeFilter]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [sumRes, transRes] = await Promise.all([
        api.getFinanceSummary(),
        api.getFinanceTransactions(typeFilter)
      ]);
      setSummary(sumRes.summary || {});
      setTransactions(transRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.createFinanceTransaction(form);
      setModalOpen(false);
      setForm({
        type: 'income',
        category: 'diaria',
        amount: '',
        payment_method: 'pix',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'completed'
      });
      loadFinanceData();
    } catch (err) {
      alert(err.message || 'Erro ao lançar transação');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este lançamento financeiro?')) return;
    try {
      await api.deleteFinanceTransaction(id);
      loadFinanceData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Módulo Financeiro & Livro Caixa
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Acompanhe receitas de diárias, despesas operacionais e saldo do mês.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Receita do Mês */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>Receitas do Mês</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600 block">
            {formatCurrency(summary?.month_income)}
          </span>
          <span className="text-[11px] text-stone-400">
            Total acumulado: {formatCurrency(summary?.total_income)}
          </span>
        </div>

        {/* Despesas do Mês */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>Despesas do Mês</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-rose-600 block">
            {formatCurrency(summary?.month_expense)}
          </span>
          <span className="text-[11px] text-stone-400">
            Total acumulado: {formatCurrency(summary?.total_expense)}
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>Saldo Líquido</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className={`text-2xl sm:text-3xl font-serif font-bold block ${
            (summary?.month_balance || 0) >= 0 ? 'text-stone-900' : 'text-rose-600'
          }`}>
            {formatCurrency(summary?.month_balance)}
          </span>
          <span className="text-[11px] text-stone-400">
            Lucro do período atual
          </span>
        </div>

      </div>

      {/* Monthly Chart Breakdown */}
      {summary?.chart_data && summary.chart_data.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Histórico Mensal de Fluxo de Caixa
          </h3>
          
          <div className="grid grid-cols-6 gap-3 pt-4 items-end h-48 border-b border-stone-100 pb-2">
            {summary.chart_data.map((item, idx) => {
              const maxVal = Math.max(...summary.chart_data.map(d => Math.max(d.income, d.expense)), 1000);
              const incomeHeight = Math.min(100, Math.round((item.income / maxVal) * 100));
              const expenseHeight = Math.min(100, Math.round((item.expense / maxVal) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1.5 w-full justify-center h-32">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(10, incomeHeight)}%` }}
                      className="w-4 sm:w-6 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600"
                      title={`Receita: ${formatCurrency(item.income)}`}
                    />
                    {/* Expense Bar */}
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

          <div className="flex items-center justify-center gap-6 text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-400 rounded-sm" /> Despesas
            </span>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Lançamentos Financeiros
            </h3>
            <p className="text-stone-500 text-xs">
              Extrato completo de movimentações da pousada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                typeFilter === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              Despesas
            </button>
          </div>
        </div>

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
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-sand-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-stone-500">
                      {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      {t.description || (t.guest_name ? `Reserva #${t.reservation_id} - ${t.guest_name}` : 'Lançamento')}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase text-[11px] font-bold text-stone-500">
                      {t.payment_method}
                    </td>
                    <td className={`px-6 py-4 font-bold font-serif text-sm ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-400">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-100 my-8">
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-white">
                Novo Lançamento Financeiro
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Tipo *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none font-bold"
                  >
                    <option value="income">Receita (+)</option>
                    <option value="expense">Despesa (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Categoria *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                >
                  <option value="diaria">Diária de Hospedagem</option>
                  <option value="frigobar">Frigobar / Consumo</option>
                  <option value="passeio">Passeio / Comissão</option>
                  <option value="energia">Energia Elétrica / Água</option>
                  <option value="limpeza">Lavanderia & Limpeza</option>
                  <option value="manutencao">Manutenção & Reparos</option>
                  <option value="insumos">Café da Manhã / Insumos</option>
                  <option value="pessoal">Pessoal / Diárias</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Compra de frutas para café da manhã"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
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
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.transaction_date}
                    onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider"
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
