import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, BedDouble, Calendar, DollarSign, 
  BookOpen, Settings, LogOut, ExternalLink, Menu, X, 
  Waves, ShieldCheck, User
} from 'lucide-react';
import { getAuthToken, getAuthUser, removeAuthToken, removeAuthUser } from '../../services/api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getAuthUser();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    removeAuthToken();
    removeAuthUser();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/acomodacoes', label: 'Suítes & Lofts', icon: BedDouble },
    { to: '/admin/reservas', label: 'Reservas & Calendário', icon: Calendar },
    { to: '/admin/financeiro', label: 'Módulo Financeiro', icon: DollarSign },
    { to: '/admin/blog', label: 'Gerenciar Blog', icon: BookOpen },
    { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-800">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-amber-500" />
          <span className="font-serif font-bold text-base">Pousada Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-stone-800 text-stone-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 space-y-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 border-b border-stone-800 pb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white leading-tight">
                Pousada Monte Alto
              </h2>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                Painel Gerencial
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'hover:bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User info and Logout */}
        <div className="p-6 border-t border-stone-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">
                {user?.name || 'Administrador'}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                {user?.email || 'admin@pousada.com'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/"
              target="_blank"
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 p-2 rounded-xl transition-colors"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        <header className="hidden md:flex bg-white border-b border-stone-200 px-8 py-4 items-center justify-between sticky top-0 z-30 shadow-sm">
          <div>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-semibold">
              Painel Administrativo
            </span>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Pousada Monte Alto • Arraial do Cabo
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-600 bg-sand-50 hover:bg-sand-100 border border-sand-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Site Público</span>
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-8 flex-1">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
