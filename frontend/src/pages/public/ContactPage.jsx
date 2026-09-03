import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Phone, Mail, Clock, MessageCircle, 
  Send, CheckCircle2, AlertCircle
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/SocialIcons';
import SEOHead from '../../components/SEOHead';
import LocationMapSection from '../../components/LocationMapSection';

export default function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      <SEOHead
        title="Fale Conosco e Reservas"
        description="Entre em contato com a Pousada Monte Alto em Arraial do Cabo. Telefone, WhatsApp (21) 96949-3569, e-mail e atendimento para sua viagem perfeita."
      />

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          Atendimento & Dúvidas
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white drop-shadow-2xl">
          {t('contact.title')}
        </h1>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          {t('contact.subtitle')}
        </p>
      </div>

      {/* Contact Channels & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Direct Contacts */}
        <div className="space-y-8">
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Canais Diretos de Contato
            </h3>

            <div className="space-y-5 text-sm text-stone-700">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.addressTitle')}</strong>
                  <span className="text-xs text-stone-600">{t('contact.addressText')}</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.whatsappTitle')}</strong>
                  <span className="text-xs text-stone-600">+55 (21) 96949-3569 • +55 (24) 99335-0954</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.emailTitle')}</strong>
                  <span className="text-xs text-stone-600">contato@pousadamontealto.com.br</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.hoursTitle')}</strong>
                  <span className="text-xs text-stone-600">{t('contact.hoursText')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
              <span className="text-xs text-stone-500 font-medium">Siga-nos nas redes:</span>
              <div className="flex gap-2">
                <a
                  href="https://instagram.com/pousadamontealtooficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                  title="Instagram Oficial"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com/pousadamontealtooficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 space-y-6">
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            {t('contact.formTitle')}
          </h3>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl space-y-2 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base">{t('contact.sentSuccess')}</h4>
              <p className="text-xs text-emerald-700">{t('contact.sentDesc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  {t('contact.name')} *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    {t('contact.phone')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(21) 99999-9999"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    {t('contact.email')}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seuemail@exemplo.com"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  {t('contact.message')} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Como podemos te ajudar? Datas de interesse, número de hóspedes ou dúvidas..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Send className="w-4 h-4" />
                <span>{t('contact.send')}</span>
              </button>
            </form>
          )}
        </div>

      </div>

      {/* 🚀 HIGH-EMPHASIS GPS MAP & ROUTE TRACING SECTION */}
      <LocationMapSection />

    </div>
  );
}
