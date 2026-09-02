import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BedDouble, Calendar, DollarSign, Users, 
  MessageCircle, ArrowUpRight, Plus, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, Sparkles, Video
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    roomsCount: 4,
    reservationsCount: 0,
    pendingReservations: 0,
    monthIncome: 0,
    monthBalance: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [roomsRes, resRes, finRes] = await Promise.all([
        api.getAccommodations(false).catch(() => ({ data: [] })),
        api.getReservations().catch(() => ({ data: [] })),
        api.getFinanceSummary().catch(() => ({ summary: {} }))
      ]);

      const allRes = resRes.data || [];
      const pendingCount = allRes.filter(r => r.status === 'pending').length;

      setStats({
        roomsCount: (roomsRes.data || []).length,
        reservationsCount: allRes.length,
        pendingReservations: pendingCount,
        monthIncome: finRes.summary?.month_income || 0,
        monthBalance: finRes.summary?.month_balance || 0,
      });

      setRecentReservations(allRes.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Confirmada</span>;
      case 'checked_in':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Hóspede no Local</span>;
      case 'checked_out':
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Finalizada</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Cancelada</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pendente</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Visão Geral da Pousada
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Acompanhe a ocupação das suítes, novas solicitações e fluxo financeiro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/reservas"
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva</span>
          </Link>
          <Link
            to="/admin/acomodacoes"
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <BedDouble className="w-4 h-4" />
            <span>Gerenciar Suítes</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Faturamento Mês */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Receita do Mês
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 block">
            {formatCurrency(stats.monthIncome)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Saldo líquido: {formatCurrency(stats.monthBalance)}
          </span>
        </div>

        {/* Card 2: Reservas Pendentes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Solicitações Pendentes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-600 block">
            {stats.pendingReservations}
          </span>
          <span className="text-[11px] text-stone-500">
            Aguardando confirmação via WhatsApp
          </span>
        </div>

        {/* Card 3: Total Reservas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total de Reservas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 block">
            {stats.reservationsCount}
          </span>
          <span className="text-[11px] text-stone-500">
            No histórico da pousada
          </span>
        </div>

        {/* Card 4: Suítes e Lofts Ativos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Acomodações
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 block">
            {stats.roomsCount}
          </span>
          <span className="text-[11px] text-stone-500">
            Suítes e Lofts cadastrados
          </span>
        </div>

      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Últimas Reservas e Solicitações
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Clique para confirmar ou abrir conversa no WhatsApp com o hóspede.
            </p>
          </div>
          <Link
            to="/admin/reservas"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Ver todas as reservas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-sand-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200/50">
              <tr>
                <th className="px-6 py-3.5">Hóspede</th>
                <th className="px-6 py-3.5">Acomodação</th>
                <th className="px-6 py-3.5">Período</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentReservations.length > 0 ? (
                recentReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      <div>{res.guest_name}</div>
                      <div className="text-[11px] text-stone-400 font-normal">{res.guest_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {res.accommodation_name || 'Suíte Monte Alto'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(res.check_in).toLocaleDateString('pt-BR')} até {new Date(res.check_out).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      {formatCurrency(res.total_price)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://wa.me/${res.guest_phone?.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(res.guest_name)}!%20Falamos%20da%20Pousada%20Monte%20Alto%20sobre%20sua%20reserva.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition-colors"
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
                    Nenhuma reserva cadastrada no momento.
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
