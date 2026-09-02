import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Phone, Mail, Clock, MessageCircle, 
  Send, CheckCircle2, AlertCircle
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/SocialIcons';

export default function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
          Atendimento & Dúvidas
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
          {t('contact.title')}
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Contact Info */}
        <div className="space-y-8">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
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
                  <strong className="block text-stone-900">{t('contact.phoneTitle')}</strong>
                  <a href="https://wa.me/5521969493569" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 font-semibold block hover:underline">
                    WhatsApp: (21) 96949-3569
                  </a>
                  <a href="tel:+5524993350954" className="text-xs text-stone-600 block">
                    Fábio / Recepção: (24) 99335-0954
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.emailTitle')}</strong>
                  <a href="mailto:contato@pousadamontealto.com.br" className="text-xs text-stone-600 hover:underline">
                    contato@pousadamontealto.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-sand-100 text-stone-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-stone-900">{t('contact.hoursTitle')}</strong>
                  <span className="text-xs text-stone-600">{t('contact.hoursText')}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Direct CTA */}
            <div className="pt-2">
              <a
                href="https://wa.me/5521969493569?text=Ol%C3%A1!%20Estou%20no%20site%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp Agora</span>
              </a>
            </div>
          </div>

        </div>

        {/* Contact Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            {t('contact.sendMessage')}
          </h3>

          {sent ? (
            <div className="text-center py-10 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-serif text-xl font-bold text-stone-900">Mensagem Enviada!</h4>
              <p className="text-stone-600 text-xs">
                Obrigado pelo contato! Nossa equipe responderá o mais breve possível via WhatsApp ou e-mail.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(21) 99999-9999"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seuemail@exemplo.com"
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Sua Mensagem *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Como podemos te ajudar? Dúvidas sobre datas, quartos ou pets..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3.5 rounded-2xl shadow-md uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t('contact.sendButton')}</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
