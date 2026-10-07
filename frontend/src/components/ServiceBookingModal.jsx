import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Users, MessageCircle, 
  CheckCircle2, AlertCircle, Sparkles, Send, Compass, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function ServiceBookingModal({ service, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_date: '',
    service_time: '09:00',
    participants_count: 2,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !service) return null;

  const unitPrice = Number(service.price_per_person) || 0;
  const participants = Math.max(1, Number(formData.participants_count) || 1);
  const totalPrice = unitPrice * participants;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const pousadaWhatsApp = '5521969493569';
  const buildDirectWhatsAppUrl = () => {
    const formattedDate = formData.service_date 
      ? new Date(formData.service_date + 'T00:00:00').toLocaleDateString('pt-BR') 
      : 'A definir';
    const msg = `Olá! Gostaria de consultar vagas para o passeio *${service.name_pt}* através da Pousada Monte Alto:
- *Nome:* ${formData.customer_name || 'Visitante'}
- *Data:* ${formattedDate} (${formData.service_time})
- *Participantes:* ${participants} pessoa(s)
- *Total estimado:* ${formatCurrency(totalPrice)}
${formData.notes ? `- *Observações:* ${formData.notes}` : ''}`;
    return `https://wa.me/${pousadaWhatsApp}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        service_id: service.id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        service_date: formData.service_date,
        service_time: formData.service_time,
        participants_count: participants,
        notes: formData.notes
      };

      const res = await api.createPublicServiceBooking(payload);
      setSubmittedResult(res);
    } catch (err) {
      setError(err.message || 'Erro ao enviar solicitação de agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100 relative text-stone-800">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest block">
              Agendamento de Passeio
            </span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {service.duration_label || 'Passeio'}
            </span>
          </div>

          <h3 className="text-xl font-serif font-bold text-white pr-6">
            {service.name_pt}
          </h3>

          <div className="mt-2 flex items-center justify-between text-xs text-stone-300">
            <span>{service.tagline_pt || 'Experiência exclusiva em Arraial do Cabo'}</span>
            <span className="font-bold text-amber-400 text-sm">{formatCurrency(unitPrice)} <span className="text-[10px] font-normal text-stone-300">/pessoa</span></span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {submittedResult ? (
            /* Success State */
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-stone-900">
                  Solicitação Registrada!
                </h4>
                <p className="text-stone-600 text-sm mt-2 max-w-sm mx-auto">
                  {submittedResult.message || 'Seu agendamento foi registrado com sucesso. Para confirmar as vagas de imediato, clique no botão abaixo para falar com nosso concierge via WhatsApp.'}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-left text-xs space-y-1.5 text-stone-700 max-w-sm mx-auto">
                <p className="font-semibold text-stone-900 flex items-center justify-between border-b border-stone-200 pb-1.5 mb-1.5">
                  <span>Resumo do Passeio:</span>
                  <span className="text-amber-600 font-bold">#{submittedResult.id}</span>
                </p>
                <p>• <strong>Passeio:</strong> {service.name_pt}</p>
                <p>• <strong>Data:</strong> {formData.service_date} às {formData.service_time}</p>
                <p>• <strong>Participantes:</strong> {participants} pessoa(s)</p>
                <p>• <strong>Total estimado:</strong> <span className="text-emerald-700 font-bold">{formatCurrency(totalPrice)}</span></p>
              </div>

              {submittedResult.whatsapp_url && (
                <div className="space-y-3 pt-2">
                  <a
                    href={submittedResult.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>Confirmar Vagas no WhatsApp</span>
                  </a>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 text-stone-500 hover:text-stone-700 text-xs font-semibold"
                  >
                    Fechar Janela
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(21) 99999-9999"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Data Desejada *</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Horário</span>
                  </label>
                  <select
                    value={formData.service_time}
                    onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                  >
                    <option value="09:00">09:00 (Manhã)</option>
                    <option value="11:00">11:00 (Intermediário)</option>
                    <option value="14:00">14:00 (Tarde)</option>
                    <option value="16:00">16:00 (Pôr do Sol)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>Pessoas</span>
                  </label>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, participants_count: Math.max(1, participants - 1) })}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-sm text-stone-800">
                      {participants}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, participants_count: Math.min(service.max_participants || 20, participants + 1) })}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Observações ou Pedidos Especiais
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Hóspede da Suíte Master, crianças no grupo, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Live Calculation Bar */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-900 block font-medium">Valor Estimado ({participants} {participants === 1 ? 'pessoa' : 'pessoas'}):</span>
                  <span className="text-xl font-black text-amber-700">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <div className="text-right text-[10px] text-amber-900/80">
                  <span className="flex items-center gap-1 justify-end font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sem cobrança antecipada
                  </span>
                  <span>Pagamento direto no dia do passeio</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {loading ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Solicitar Agendamento</span>
                    </>
                  )}
                </button>

                <a
                  href={buildDirectWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp Direto</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
