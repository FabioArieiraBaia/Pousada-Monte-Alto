import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Calendar, Users, PawPrint, MessageCircle, 
  CheckCircle2, AlertCircle, Sparkles, Send, Flame, FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function BookingModal({ room, initialDates = {}, isOpen, onClose }) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: initialDates.check_in || '',
    check_out: initialDates.check_out || '',
    adults_count: initialDates.guests || 2,
    children_count: 0,
    has_pets: initialDates.pets || false,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !room) return null;

  const isPromo = room.is_promo !== undefined ? Number(room.is_promo) === 1 : true;

  // Calculate nights and estimated total
  let nights = 1;
  let estimatedTotal = room.base_price;
  if (formData.check_in && formData.check_out) {
    const diff = (new Date(formData.check_out) - new Date(formData.check_in)) / (1000 * 60 * 60 * 24);
    nights = Math.max(1, Math.round(diff));
    estimatedTotal = nights * room.base_price;
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const pousadaWhatsApp = '5521969493569';
  const buildDirectWhatsAppUrl = () => {
    const msg = `Olá! Gostaria de consultar valores e disponibilidade para a *${room.name_pt}* na Pousada Monte Alto:
- *Nome:* ${formData.guest_name || 'Hóspede'}
- *Datas:* ${formData.check_in || 'A definir'} até ${formData.check_out || 'A definir'} (${nights} diárias)
- *Hóspedes:* ${formData.adults_count} adulto(s)${formData.has_pets ? ' (com pet 🐾)' : ''}
${formData.notes ? `- *Observações:* ${formData.notes}` : ''}`;
    return `https://wa.me/${pousadaWhatsApp}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        accommodation_id: room.id,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        check_in: formData.check_in,
        check_out: formData.check_out,
        adults_count: formData.adults_count,
        children_count: formData.children_count,
        has_pets: formData.has_pets,
        notes: formData.notes
      };

      const res = await api.createPublicReservation(payload);
      setSubmittedResult(res);
    } catch (err) {
      setError(err.message || 'Erro ao enviar solicitação de reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100 relative">
        
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
              {isPromo ? 'Cotação Promocional & Reserva' : t('booking.title')}
            </span>
            {isPromo && (
              <span className="bg-amber-500 text-stone-950 text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase">
                Sob Consulta
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">
            {room.name_pt}
          </h3>
          <p className="text-stone-300 text-xs mt-1">
            Preencha seus dados para receber o valor promocional e garantir sua reserva.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submittedResult ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-stone-900">
                Solicitação Recebida com Sucesso!
              </h4>
              <p className="text-stone-600 text-xs sm:text-sm max-w-sm mx-auto">
                Registramos seu pedido. Nossa equipe entrará em contato pelo WhatsApp para confirmar os valores com desconto e finalizar sua reserva.
              </p>

              <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200 text-left text-xs space-y-1.5 text-stone-700">
                <p><strong>Acomodação:</strong> {room.name_pt}</p>
                <p><strong>Período:</strong> {formData.check_in} até {formData.check_out} ({nights} diárias)</p>
                <p><strong>Condição:</strong> Valor sob consulta com desconto promocional</p>
              </div>

              <div className="pt-4 flex flex-col gap-2.5">
                <a
                  href={submittedResult.whatsapp_url || buildDirectWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Agilizar Confirmação via WhatsApp</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-2xl text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            /* Reservation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    {t('booking.fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    {t('booking.phone')} / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    placeholder="(21) 99999-9999"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  {t('booking.email')} (Opcional)
                </label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  placeholder="seuemail@exemplo.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Check-in *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_in}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Check-out *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_out}
                    min={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Guests and Pet */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    {t('booking.adults')}
                  </label>
                  <select
                    value={formData.adults_count}
                    onChange={(e) => setFormData({ ...formData, adults_count: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    {[...Array(room.max_guests || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} Adulto(s)</option>
                    ))}
                  </select>
                </div>

                {room.accepts_pets == 1 && (
                  <label className="flex items-center gap-2 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_pets}
                      onChange={(e) => setFormData({ ...formData, has_pets: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                      {t('booking.bringingPet')}
                    </span>
                  </label>
                )}
              </div>

              {/* Total Summary Box with Strikethrough & Sob Consulta */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-600 block">
                    {formData.check_in && formData.check_out ? `${nights} diárias selecionadas` : 'Período a consultar'}
                  </span>
                  {isPromo ? (
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="line-through text-stone-400 text-xs font-semibold">
                        {formatCurrency(estimatedTotal)}
                      </span>
                      <span className="text-lg font-bold text-amber-700 font-serif">
                        Sob Consulta (Promo)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-amber-700 font-serif">
                      {formatCurrency(estimatedTotal)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-amber-900 bg-amber-200/60 px-2 py-1 rounded-md font-bold">
                  Tarifa Direta
                </span>
              </div>

              {/* Dual Submit Options: Platform Form or 1-Click WhatsApp */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-stone-950 font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                  {loading ? (
                    <span>Enviando solicitação...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Solicitar Cotação / Reservar</span>
                    </>
                  )}
                </button>

                <a
                  href={buildDirectWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Cotação Direto pelo WhatsApp</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
