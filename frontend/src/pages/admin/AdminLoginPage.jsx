import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { api, setAuthToken, setAuthUser } from '../../services/api';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pousadamontealto.com.br');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setAuthUser(res.user);
        navigate('/admin/dashboard');
      } else {
        setError('Falha ao autenticar.');
      }
    } catch (err) {
      setError(err.message || 'Erro ao realizar login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-stone-100">
      
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-20 -right-20" />

      {/* Back link */}
      <div className="mb-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao site público
        </Link>
      </div>

      {/* Login Card */}
      <div className="bg-stone-900 border border-stone-800 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full relative z-10 space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Logo variant="light" size="lg" showText={false} />
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">
              Painel Administrativo
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Pousada Monte Alto • Arraial do Cabo
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pousadamontealto.com.br"
                className="w-full bg-stone-950 text-white pl-10 pr-4 py-3 rounded-2xl border border-stone-700 focus:outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-950 text-white pl-10 pr-4 py-3 rounded-2xl border border-stone-700 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Entrando...' : 'Acessar Painel Admin'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-800/80">
          <span className="text-[11px] text-stone-500">
            Acesso restrito à equipe da Pousada Monte Alto
          </span>
        </div>

      </div>

    </div>
  );
}
