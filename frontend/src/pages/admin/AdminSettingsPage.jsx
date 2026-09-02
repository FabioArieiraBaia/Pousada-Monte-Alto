import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Phone, MessageCircle, Mail, 
  MapPin, Clock, Wifi, CheckCircle2, AlertCircle, Share2
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
    wifi_info: 'Pousada_MonteAlto_Guest / senha: bemvindoaomontealto'
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
          Atualize telefones, chaves PIX, endereço, dados de contato e redes sociais.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Configurações salvas e aplicadas com sucesso em todo o site!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
        
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

        {/* Contacts & WhatsApp */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Canais de Atendimento & Reservas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Principal
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
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-600" /> WhatsApp Secundário / Fábio
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
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-600" /> E-mail Oficial
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Address & Hours */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Localização & Horários de Funcionamento
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" /> Endereço Completo em Monte Alto
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Horário de Check-in
              </label>
              <input
                type="text"
                value={settings.checkin_time}
                onChange={(e) => setSettings({ ...settings, checkin_time: e.target.value })}
                placeholder="14:00"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Horário de Check-out
              </label>
              <input
                type="text"
                value={settings.checkout_time}
                onChange={(e) => setSettings({ ...settings, checkout_time: e.target.value })}
                placeholder="12:00"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* PIX & Wi-Fi */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Pagamentos PIX & Wi-Fi para Hóspedes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Chave PIX da Pousada
              </label>
              <input
                type="text"
                value={settings.pix_key}
                onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                placeholder="contato@pousadamontealto.com.br"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-cyan-600" /> Dados do Wi-Fi dos Hóspedes
              </label>
              <input
                type="text"
                value={settings.wifi_info}
                onChange={(e) => setSettings({ ...settings, wifi_info: e.target.value })}
                placeholder="Rede / Senha"
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Redes Sociais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Instagram (@pousadamontealtooficial)
              </label>
              <input
                type="url"
                value={settings.instagram}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Facebook
              </label>
              <input
                type="url"
                value={settings.facebook}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
