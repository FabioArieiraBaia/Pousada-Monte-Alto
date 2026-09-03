import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Phone, MessageCircle, Mail, 
  MapPin, Clock, Wifi, CheckCircle2, AlertCircle, Share2, Sparkles, Tag, Flame
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    pousada_name: 'Pousada Monte Alto',
    tagline_pt: 'Seu refúgio de paz pé na areia em Arraial do Cabo',
    phone: '+55 (21) 96949-3569',
    whatsapp: '5521969493569',
    secondary_whatsapp: '5524993350954',
    email: 'contato@pousadamontealto.com.br',
    address: 'Travessa Américo Reis, Distrito de Monte Alto, Arraial do Cabo - RJ, CEP 28930-000',
    checkin_time: '14:00',
    checkout_time: '12:00',
    instagram: 'https://instagram.com/pousadamontealtooficial',
    facebook: 'https://facebook.com/pousadamontealtooficial',
    pix_key: 'contato@pousadamontealto.com.br',
    wifi_info: 'Pousada_MonteAlto_Guest / senha: bemvindoaomontealto',
    promo_mode: '1',
    promo_badge: '🔥 Oferta Especial',
    promo_text: 'Valores Promocionais Sob Consulta'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    api.getSettings()
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Configurações Gerais da Pousada
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
          Atualize tarifas promocionais, telefones, endereço, WhatsApp e redes sociais.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Configurações salvas e aplicadas com sucesso em todo o site!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-8">
        
        {/* 🌟 PROMO MODE & SOB CONSULTA BANNER 🌟 */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-500/10 p-6 rounded-3xl border border-amber-300/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Modo Promocional & Valores Sob Consulta</span>
                  <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-extrabold uppercase">
                    Destaque
                  </span>
                </h3>
                <p className="text-stone-600 text-xs mt-0.5">
                  Exibe os preços riscados e o valor como <strong>"Sob Consulta"</strong>, incentivando o visitante a entrar em contato via WhatsApp ou Formulário.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.promo_mode === '1'}
                onChange={(e) => setSettings({ ...settings, promo_mode: e.target.checked ? '1' : '0' })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-3 text-xs font-bold text-stone-800">
                {settings.promo_mode === '1' ? 'ATIVADO' : 'DESATIVADO'}
              </span>
            </label>
          </div>

          {settings.promo_mode === '1' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-amber-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Selo / Badge de Destaque
                </label>
                <input
                  type="text"
                  value={settings.promo_badge || '🔥 Oferta Especial'}
                  onChange={(e) => setSettings({ ...settings, promo_badge: e.target.value })}
                  placeholder="Ex: 🔥 Oferta Especial"
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Texto Exibido Sob Consulta
                </label>
                <input
                  type="text"
                  value={settings.promo_text || 'Valores Promocionais Sob Consulta'}
                  onChange={(e) => setSettings({ ...settings, promo_text: e.target.value })}
                  placeholder="Ex: Valores Promocionais Sob Consulta"
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none font-bold text-stone-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Basic Brand */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Identidade do Estabelecimento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Nome da Pousada
              </label>
              <input
                type="text"
                value={settings.pousada_name}
                onChange={(e) => setSettings({ ...settings, pousada_name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={settings.tagline_pt}
                onChange={(e) => setSettings({ ...settings, tagline_pt: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & WhatsApp */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-600" />
            Contatos & Atendimento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                WhatsApp Principal (somente números)
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="5521969493569"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                WhatsApp Secundário
              </label>
              <input
                type="text"
                value={settings.secondary_whatsapp}
                onChange={(e) => setSettings({ ...settings, secondary_whatsapp: e.target.value })}
                placeholder="5524993350954"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Check-in, Check-out, PIX & Wi-Fi */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Horários & Dados da Estadia
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Horário Check-in
              </label>
              <input
                type="text"
                value={settings.checkin_time}
                onChange={(e) => setSettings({ ...settings, checkin_time: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Horário Check-out
              </label>
              <input
                type="text"
                value={settings.checkout_time}
                onChange={(e) => setSettings({ ...settings, checkout_time: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={settings.pix_key}
                onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Rede Wi-Fi & Senha
              </label>
              <input
                type="text"
                value={settings.wifi_info}
                onChange={(e) => setSettings({ ...settings, wifi_info: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
