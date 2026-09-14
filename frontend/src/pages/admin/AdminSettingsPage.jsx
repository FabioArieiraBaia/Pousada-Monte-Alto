import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Phone, MessageCircle, Mail, 
  MapPin, Clock, Wifi, CheckCircle2, AlertCircle, Share2, Sparkles, Tag, Flame,
  Bell, Smartphone, Vibrate, Check, Loader2, Send, ExternalLink, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import pushNotificationService from '../../services/pushNotification';

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
    promo_text: 'Valores Promocionais Sob Consulta',
    callmebot_phone: '5521969493569',
    callmebot_api_key: '',
    notify_on_lead_whatsapp: '1',
    notify_on_lead_push: '1'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Push notification states
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState(null);
  const [deviceCount, setDeviceCount] = useState(0);

  // WhatsApp CallMeBot test states
  const [waTesting, setWaTesting] = useState(false);
  const [waMessage, setWaMessage] = useState(null);

  useEffect(() => {
    loadSettings();
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    const supported = pushNotificationService.isSupported();
    setPushSupported(supported);
    if (supported) {
      const subscribed = await pushNotificationService.isSubscribed();
      setPushSubscribed(subscribed);
    }
  };

  const loadNotificationData = () => {
    api.getNotificationSettings()
      .then(res => {
        if (res.data) {
          setDeviceCount(res.data.device_count || 0);
          setSettings(prev => ({
            ...prev,
            callmebot_phone: res.data.callmebot_phone || prev.callmebot_phone,
            callmebot_api_key: res.data.callmebot_api_key || prev.callmebot_api_key,
            notify_on_lead_whatsapp: res.data.notify_on_lead_whatsapp ? '1' : '0',
            notify_on_lead_push: res.data.notify_on_lead_push ? '1' : '0'
          }));
        }
      })
      .catch(err => console.warn('Erro ao carregar notificacoes:', err));
  };

  const loadSettings = () => {
    setLoading(true);
    Promise.all([
      api.getSettings(),
      api.getNotificationSettings().catch(() => ({ data: null }))
    ])
      .then(([resSettings, resNotif]) => {
        if (resSettings.data && Object.keys(resSettings.data).length > 0) {
          setSettings(prev => ({ ...prev, ...resSettings.data }));
        }
        if (resNotif?.data) {
          setDeviceCount(resNotif.data.device_count || 0);
          setSettings(prev => ({
            ...prev,
            callmebot_phone: resNotif.data.callmebot_phone || prev.callmebot_phone,
            callmebot_api_key: resNotif.data.callmebot_api_key || prev.callmebot_api_key,
            notify_on_lead_whatsapp: resNotif.data.notify_on_lead_whatsapp ? '1' : '0',
            notify_on_lead_push: resNotif.data.notify_on_lead_push ? '1' : '0'
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSubscribePush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      await pushNotificationService.subscribe();
      setPushSubscribed(true);
      setPushMessage({ type: 'success', text: '✅ Celular conectado! O aparelho vibrará quando chegarem novos leads e reservas.' });
      loadNotificationData();
    } catch (err) {
      setPushMessage({ type: 'error', text: err.message || 'Falha ao ativar notificações.' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleUnsubscribePush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      await pushNotificationService.unsubscribe();
      setPushSubscribed(false);
      setPushMessage({ type: 'info', text: 'Notificações desativadas neste aparelho.' });
      loadNotificationData();
    } catch (err) {
      setPushMessage({ type: 'error', text: err.message });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    setPushMessage(null);
    try {
      const res = await api.testPushNotification();
      setPushMessage({ 
        type: res.success ? 'success' : 'warning', 
        text: res.message || 'Notificação enviada com sucesso!' 
      });
    } catch (err) {
      setPushMessage({ type: 'error', text: err.message || 'Erro ao enviar push de teste.' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setWaTesting(true);
    setWaMessage(null);
    try {
      const res = await api.testWhatsAppNotification({
        phone: settings.callmebot_phone,
        api_key: settings.callmebot_api_key
      });
      setWaMessage({ 
        type: res.success ? 'success' : 'error', 
        text: res.message || (res.success ? 'Mensagem enviada com sucesso!' : 'Falha ao enviar.') 
      });
    } catch (err) {
      setWaMessage({ type: 'error', text: err.message || 'Erro ao testar envio no WhatsApp.' });
    } finally {
      setWaTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await Promise.all([
        api.updateSettings(settings),
        api.updateNotificationSettings({
          callmebot_phone: settings.callmebot_phone,
          callmebot_api_key: settings.callmebot_api_key,
          notify_on_lead_whatsapp: settings.notify_on_lead_whatsapp === '1',
          notify_on_lead_push: settings.notify_on_lead_push === '1'
        })
      ]);
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

        {/* 🔔 NOTIFICAÇÕES PUSH (CELULAR) & WHATSAPP (CALLMEBOT) 🔔 */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-stone-800 text-white space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shadow-inner">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2.5">
                  <span>Notificações de Leads & Reservas</span>
                  <span className="text-[10px] bg-teal-500 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Em Tempo Real
                  </span>
                </h3>
                <p className="text-stone-400 text-xs mt-0.5">
                  Faça seu celular vibrar com novos leads e receba mensagens automáticas no WhatsApp com link direto wa.me.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-stone-800 text-stone-300 px-3 py-1.5 rounded-xl border border-stone-700">
                📲 <strong>{deviceCount}</strong> aparelho(s) conectado(s)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Bloco 1: Web Push PWA (Android / iPhone) */}
            <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/60 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Smartphone className="w-4 h-4" />
                    <span>Push no Celular (Android & iPhone)</span>
                  </div>
                  {pushSubscribed ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Ativo neste aparelho
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-700 text-stone-400 font-medium px-2 py-0.5 rounded-full">
                      Inativo neste navegador
                    </span>
                  )}
                </div>

                <p className="text-stone-300 text-xs leading-relaxed">
                  Faz o celular vibrar e exibe o alerta na tela bloqueada no mesmo segundo em que um visitante solicita reserva ou informa contato à Concierge IA.
                </p>

                {/* Mensagens de feedback do Push */}
                {pushMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pushMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800' :
                    pushMessage.type === 'warning' ? 'bg-amber-950/80 text-amber-200 border border-amber-800' :
                    'bg-red-950/80 text-red-200 border border-red-800'
                  }`}>
                    {pushMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                    <span>{pushMessage.text}</span>
                  </div>
                )}

                {/* Dica iPhone */}
                <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-700/50 text-[11px] text-stone-400 space-y-1">
                  <div className="font-bold text-stone-200 flex items-center gap-1">
                    <span>🍎 Como instalar no iPhone (Apple iOS):</span>
                  </div>
                  <p>
                    Abra o painel no Safari ➔ toque em <strong>Compartilhar</strong> (ícone com seta) ➔ <strong>"Adicionar à Tela de Início"</strong>. Abra pelo ícone na tela inicial e clique em Ativar abaixo.
                  </p>
                </div>
              </div>

              {/* Botões de Ação do Push */}
              <div className="pt-3 border-t border-stone-700/60 flex flex-wrap gap-2">
                {!pushSubscribed ? (
                  <button
                    type="button"
                    onClick={handleSubscribePush}
                    disabled={pushLoading}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {pushLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Vibrate className="w-4 h-4" />}
                    <span>Ativar Alertas e Vibração neste Aparelho</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleTestPush}
                      disabled={pushLoading}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Vibrate className="w-3.5 h-3.5" />}
                      <span>Testar Vibração no Aparelho</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUnsubscribePush}
                      disabled={pushLoading}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs py-2 px-3 rounded-xl transition-all border border-stone-700"
                    >
                      Desativar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bloco 2: WhatsApp CallMeBot */}
            <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/60 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp do Administrador (CallMeBot)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notify_on_lead_whatsapp === '1'}
                      onChange={(e) => setSettings({ ...settings, notify_on_lead_whatsapp: e.target.checked ? '1' : '0' })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <p className="text-stone-300 text-xs leading-relaxed">
                  Envia a ficha do lead no seu WhatsApp com dados da reserva e link direto <strong>wa.me</strong> para responder o cliente em 1 clique.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
                      Seu Número do WhatsApp (com DDI e DDD)
                    </label>
                    <input
                      type="text"
                      value={settings.callmebot_phone}
                      onChange={(e) => setSettings({ ...settings, callmebot_phone: e.target.value })}
                      placeholder="Ex: 5521969493569"
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 flex items-center justify-between">
                      <span>Chave de API do CallMeBot (API Key)</span>
                      <a
                        href="https://api.callmebot.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-normal lowercase text-[10px]"
                      >
                        como obter <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </label>
                    <input
                      type="text"
                      value={settings.callmebot_api_key}
                      onChange={(e) => setSettings({ ...settings, callmebot_api_key: e.target.value })}
                      placeholder="Cole sua API Key recebida no WhatsApp"
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Passo a passo CallMeBot */}
                <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-700/50 text-[11px] text-stone-400 space-y-1">
                  <div className="font-bold text-stone-200">⚡ Ativação Gratuita (Leva 1 minuto):</div>
                  <p>
                    1. Salve o contato <strong>+34 911 06 59 79</strong> no seu WhatsApp.<br />
                    2. Envie o texto: <code className="bg-stone-800 px-1 py-0.5 rounded text-emerald-300">I allow callmebot to send me messages</code><br />
                    3. O bot responderá sua chave (ex: <code>1234567</code>). Cole no campo acima e teste!
                  </p>
                </div>

                {/* Feedback WhatsApp */}
                {waMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    waMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800' : 'bg-red-950/80 text-red-200 border border-red-800'
                  }`}>
                    {waMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span>{waMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Botão Testar WhatsApp */}
              <div className="pt-3 border-t border-stone-700/60">
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={waTesting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {waTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Testar Envio no WhatsApp</span>
                </button>
              </div>
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
