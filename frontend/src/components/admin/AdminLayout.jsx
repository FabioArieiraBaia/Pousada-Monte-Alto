import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, BedDouble, Calendar, DollarSign, 
  BookOpen, Settings, LogOut, ExternalLink, Menu, X, 
  ShieldCheck, User
} from 'lucide-react';
import { getAuthToken, getAuthUser, removeAuthToken, removeAuthUser } from '../../services/api';
import Logo from '../Logo';

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
        <Link to="/admin/dashboard" className="flex items-center">
          <Logo variant="light" size="sm" />
        </Link>
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
          <div className="border-b border-stone-800 pb-5">
            <Link to="/admin/dashboard" className="block">
              <Logo variant="light" size="sm" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions */}
        <div className="p-6 border-t border-stone-800/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-stone-700">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-xs text-white block truncate">
                {user?.name || 'Administrador'}
              </span>
              <span className="text-[10px] text-stone-500 block truncate">
                {user?.email || 'admin@pousadamontealto.com.br'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              target="_blank"
              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Site Público</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium border border-rose-900/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair do Painel</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
