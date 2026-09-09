import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, X, Send, Sparkles, Bot, User, 
  Calendar, CheckCircle2, ChevronRight, Phone, ExternalLink, Flame, ShieldAlert, Heart
} from 'lucide-react';
import { api } from '../services/api';

export default function AIChatWidget() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [agentName, setAgentName] = useState('Marina - Concierge Monte Alto');

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Quick prompt pills
  const quickPills = [
    { label: '🐾 Quais suítes aceitam Pet?', text: 'Quais suítes ou lofts aceitam animais de estimação (pet friendly)?' },
    { label: '💑 Melhor opção para Casal', text: 'Qual a suíte mais aconchegante e romântica para um casal?' },
    { label: '💰 Estimar valor de diárias', text: 'Gostaria de estimar o valor da estadia para o próximo mês.' },
    { label: '🌊 Como funciona o acesso à praia?', text: 'A pousada é pé na areia mesmo? Como é a praia de Monte Alto?' },
  ];

  // Initial greeting
  useEffect(() => {
    let welcome = 'Olá! Sou a Marina, Concierge Virtual da Pousada Monte Alto. Estou aqui para te ajudar a escolher a melhor suíte pé na areia, tirar dúvidas sobre Arraial do Cabo e fazer sua pré-reserva com condições exclusivas!';
    if (lang === 'en') {
      welcome = 'Hello! I am Marina, Virtual Concierge at Pousada Monte Alto. I can help you choose the best beachfront suite, discover Arraial do Cabo, and pre-book your stay!';
    } else if (lang === 'es') {
      welcome = '¡Hola! Soy Marina, Concierge Virtual de Posada Monte Alto. ¡Te ayudo a elegir la mejor suite frente al mar, planear tu viaje a Arraial do Cabo y hacer tu pre-reserva!';
    }

    setMessages([
      {
        id: 'init-1',
        sender: 'model',
        text: welcome,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewMessage(false);
      setTimeout(() => chatInputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendMessageToAI(newHistory);
      
      const botMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'model',
        text: res.response || 'Desculpe, não consegui processar no momento. Gostaria de falar com nossa recepção no WhatsApp?',
        action: res.action,
        pre_reservation: res.pre_reservation,
        whatsapp_url: res.whatsapp_url,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...newHistory, botMsg]);
      if (!isOpen) setHasNewMessage(true);

    } catch (err) {
      console.error(err);
      setMessages([
        ...newHistory,
        {
          id: 'err-' + Date.now(),
          sender: 'model',
          text: 'Tive uma breve oscilação de conexão, mas você pode falar diretamente com nossa equipe no WhatsApp agora mesmo!',
          whatsapp_url: 'https://wa.me/5521969493569?text=' + encodeURIComponent('Olá! Estava conversando no site da Pousada Monte Alto e gostaria de atendimento.'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🟢 FLOATING LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        
        {/* Floating Callout Pill if Chat is Closed */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md text-stone-800 text-xs font-bold py-2 px-4 rounded-full shadow-2xl border border-stone-200/80 hover:bg-amber-50 transition-all transform hover:scale-105 cursor-pointer animate-bounce"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Fale com a Concierge Virtual</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        )}

        {/* Circular Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir Atendimento Inteligente"
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-stone-900 via-amber-900 to-amber-600 text-white shadow-2xl flex items-center justify-center border-2 border-amber-400/80 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <Sparkles className="w-6 h-6 text-amber-300" />
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-stone-900 animate-ping" />
              )}
            </div>
          )}

          {/* Online status indicator */}
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
        </button>
      </div>

      {/* 💬 EXPANDED CHAT MODAL */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-w-[420px] h-[550px] max-h-[82vh] bg-stone-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-fade-in text-stone-100">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-black flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-stone-950" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-stone-900" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{agentName}</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-sans font-bold">
                    IA 2.5 Flash
                  </span>
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • Pousada Monte Alto</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-light leading-relaxed">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl shadow-md ${
                      isUser
                        ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                        : 'bg-stone-800/90 text-stone-200 border border-white/10 rounded-tl-none space-y-2'
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* 🌟 PRE-RESERVATION CARD IF CREATED 🌟 */}
                    {msg.pre_reservation && (
                      <div className="mt-3 bg-stone-900/90 p-3.5 rounded-xl border border-amber-400/40 space-y-2 text-stone-200">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Pré-Reserva Registrada!</span>
                        </div>

                        <div className="text-[11px] space-y-1 border-y border-white/10 py-2">
                          <p><strong>Acomodação:</strong> {msg.pre_reservation.accommodation_name}</p>
                          <p><strong>Hóspede:</strong> {msg.pre_reservation.guest_name}</p>
                          <p><strong>Período:</strong> {msg.pre_reservation.check_in} até {msg.pre_reservation.check_out} ({msg.pre_reservation.nights} diárias)</p>
                          {msg.pre_reservation.total_price > 0 && (
                            <p className="text-amber-300 font-bold">
                              <strong>Total Estimado:</strong> R$ {Number(msg.pre_reservation.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>

                        <span className="text-[10px] text-stone-400 block italic">
                          Aguardando confirmação do sinal pela equipe da pousada.
                        </span>
                      </div>
                    )}

                    {/* WhatsApp Action Button */}
                    {msg.whatsapp_url && (
                      <div className="pt-2">
                        <a
                          href={msg.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md transform hover:scale-[1.02]"
                        >
                          <Phone className="w-3.5 h-3.5 fill-stone-950" />
                          <span>Finalizar no WhatsApp Agora</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-stone-500 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-stone-400 bg-stone-800/50 p-2.5 rounded-xl w-fit border border-white/5 animate-pulse text-[11px]">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Digitando resposta...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Pills (if few messages) */}
          {messages.length <= 3 && (
            <div className="p-2.5 border-t border-white/10 bg-stone-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(pill.text)}
                  className="whitespace-nowrap bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-[10px] font-medium py-1.5 px-3 rounded-full border border-white/10 transition-colors shrink-0 cursor-pointer"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-stone-950 border-t border-white/10 flex items-center gap-2"
          >
            <input
              ref={chatInputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua dúvida ou datas..."
              disabled={loading}
              className="flex-1 bg-stone-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 p-2.5 rounded-xl transition-all font-bold cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
