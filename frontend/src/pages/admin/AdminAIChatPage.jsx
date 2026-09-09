import React, { useState, useEffect } from 'react';
import { 
  Bot, Users, MessageSquare, Phone, Mail, Calendar, 
  CheckCircle2, AlertCircle, Save, ExternalLink, RefreshCw, 
  Key, Settings, Sparkles, Filter, Clock, Eye, Trash2
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAIChatPage() {
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'settings'
  
  // Leads state
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);

  // Settings state
  const [aiSettings, setAiSettings] = useState({
    agent_name: 'Marina - Concierge Monte Alto',
    is_active: 1,
    system_instructions: '',
    welcome_message_pt: '',
    welcome_message_en: '',
    welcome_message_es: '',
    keys: []
  });
  const [keysText, setKeysText] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadLeads();
    loadAISettings();
  }, []);

  const loadLeads = () => {
    setLoadingLeads(true);
    api.getLeads()
      .then(res => {
        if (res.data) {
          setLeads(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingLeads(false));
  };

  const loadAISettings = () => {
    setLoadingSettings(true);
    api.getAISettings()
      .then(res => {
        if (res.data) {
          setAiSettings(res.data);
          if (Array.isArray(res.data.keys)) {
            setKeysText(res.data.keys.join('\n'));
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingSettings(false));
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await api.updateLeadStatus(leadId, newStatus);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSavedSuccess(false);

    try {
      const keysArray = keysText
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 10);

      await api.updateAISettings({
        ...aiSettings,
        api_keys: keysArray
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert('Erro ao salvar configurações de IA: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300">Novo Lead</span>;
      case 'in_negotiation':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-sky-300">Em Conversa</span>;
      case 'converted':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">Reserva Confirmada</span>;
      case 'lost':
        return <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2.5 py-1 rounded-full">Perdido / Desistiu</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <Bot className="w-8 h-8 text-amber-600" />
            <span>Concierge IA & Gestão de Leads (Gemini 2.5 Flash)</span>
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Gerencie os leads captados pelo agente virtual, visualize pré-reservas e configure a inteligência de vendas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Leads Captados ({leads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Prompt</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          ABA 1: LEADS CAPTADOS & PRÉ-RESERVAS
      ======================================================== */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-stone-700 text-xs font-bold">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Filtrar por Status:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'new', 'in_negotiation', 'converted', 'lost'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    filterStatus === st
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st === 'all' && 'Todos'}
                  {st === 'new' && 'Novos'}
                  {st === 'in_negotiation' && 'Em Conversa'}
                  {st === 'converted' && 'Confirmados'}
                  {st === 'lost' && 'Perdidos'}
                </button>
              ))}

              <button
                onClick={loadLeads}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 ml-2"
                title="Atualizar lista"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Leads Table Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
            {loadingLeads ? (
              <div className="p-12 text-center text-stone-400">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Carregando leads da IA...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center text-stone-500 space-y-2">
                <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="font-bold">Nenhum lead encontrado com esse filtro.</p>
                <p className="text-xs">Assim que visitantes conversarem com o agente no site e informarem seus dados, eles aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="p-4">Data/Hora</th>
                      <th className="p-4">Lead / Contato</th>
                      <th className="p-4">Acomodação</th>
                      <th className="p-4">Período de Interesse</th>
                      <th className="p-4">Valor Estimado</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLeads.map(lead => {
                      const waLink = lead.whatsapp ? `https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${lead.name}! Vi seu interesse na ${lead.accommodation_name || 'Pousada Monte Alto'}. Como podemos te ajudar a confirmar sua reserva?`)}` : null;

                      return (
                        <tr key={lead.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')} {new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          
                          <td className="p-4">
                            <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                              <span>{lead.name || 'Visitante'}</span>
                              {lead.has_pets ? <span title="Traz Pet">🐾</span> : null}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                              {lead.whatsapp || lead.email || 'Sem telefone'}
                            </div>
                          </td>

                          <td className="p-4 font-medium text-stone-800">
                            {lead.accommodation_name || 'A definir'}
                          </td>

                          <td className="p-4 text-stone-600">
                            {lead.checkin_date && lead.checkout_date ? (
                              <span>
                                {new Date(lead.checkin_date).toLocaleDateString('pt-BR')} &rarr; {new Date(lead.checkout_date).toLocaleDateString('pt-BR')}
                                <span className="block text-[10px] text-stone-400">({lead.guests} hóspedes)</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Não especificado</span>
                            )}
                          </td>

                          <td className="p-4 font-bold text-amber-700">
                            {lead.estimated_total > 0 ? (
                              <span>R$ {Number(lead.estimated_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-stone-400 font-normal">Sob Consulta</span>
                            )}
                          </td>

                          <td className="p-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                              className="text-[11px] font-bold p-1 rounded-lg border border-stone-300 bg-white focus:outline-none"
                            >
                              <option value="new">🟡 Novo Lead</option>
                              <option value="in_negotiation">🔵 Em Conversa</option>
                              <option value="converted">🟢 Confirmado</option>
                              <option value="lost">⚪ Desistiu</option>
                            </select>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Transcript */}
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-all flex items-center gap-1"
                                title="Ver Conversa da IA"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-600" />
                                <span>Ver Chat</span>
                              </button>

                              {/* WhatsApp Quick Action */}
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold transition-all flex items-center gap-1 shadow-sm"
                                  title="Chamar no WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5 fill-stone-950" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal to view conversation transcript */}
          {selectedLead && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 animate-fade-in">
                
                <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Histórico da Conversa com a IA</h3>
                    <p className="text-xs text-stone-300">{selectedLead.name} • {selectedLead.whatsapp}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-stone-400 hover:text-white text-lg font-bold"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                  {(() => {
                    let history = [];
                    try {
                      history = JSON.parse(selectedLead.chat_history || '[]');
                    } catch (e) {}

                    if (history.length === 0) {
                      return <p className="text-stone-400 italic text-center py-8">Nenhum histórico detalhado registrado.</p>;
                    }

                    return history.map((m, idx) => {
                      const isUser = m.sender === 'user' || m.role === 'user';
                      return (
                        <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] ${
                            isUser ? 'bg-amber-500 text-stone-950 font-medium' : 'bg-stone-100 text-stone-800'
                          }`}>
                            <p className="whitespace-pre-line">{m.text || m.content}</p>
                          </div>
                          <span className="text-[9px] text-stone-400 mt-0.5 px-1">
                            {isUser ? 'Cliente' : 'Marina IA'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-600">
                    Status: {getStatusBadge(selectedLead.status)}
                  </span>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          ABA 2: CONFIGURAÇÕES & PROMPT DA IA
      ======================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {savedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">Configurações de Inteligência Artificial salvas com sucesso!</span>
            </div>
          )}

          {/* Ativação & Nome */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>Status do Atendimento Inteligente</span>
                </h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Ative ou desative o assistente virtual com Gemini 2.5 Flash no site.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.is_active}
                  onChange={(e) => setAiSettings({ ...aiSettings, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-3 text-xs font-bold text-stone-800">
                  {aiSettings.is_active ? 'ATIVADO NO SITE' : 'DESATIVADO'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Nome da Atendente / Concierge
                </label>
                <input
                  type="text"
                  value={aiSettings.agent_name || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, agent_name: e.target.value })}
                  placeholder="Ex: Marina - Concierge Monte Alto"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Modelo de Inteligência Ativo
                </label>
                <input
                  type="text"
                  disabled
                  value="Google Gemini 2.5 Flash (Oficial com Raciocínio Embutido)"
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 font-bold text-amber-700"
                />
              </div>
            </div>
          </div>

          {/* Prompt customizado do Administrador */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-600" />
                <span>Instruções Extras Personalizadas para a IA</span>
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Digite regras específicas, avisos de feriados ou políticas que você queira que a IA siga rigidamente durante a conversa com os hóspedes.
              </p>
            </div>

            <textarea
              rows={5}
              value={aiSettings.system_instructions || ''}
              onChange={(e) => setAiSettings({ ...aiSettings, system_instructions: e.target.value })}
              placeholder="Ex: Para o feriado de Réveillon temos pacote mínimo de 4 diárias. Sempre destacar que o café da manhã está incluso. Não conceder descontos maiores que 10% sem falar com a recepção."
              className="w-full text-xs p-4 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 leading-relaxed font-mono text-stone-800"
            />
          </div>

          {/* Gerenciamento de Chaves de API Gemini */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>Chaves de API do Google Gemini (Rotação Automática com Failover)</span>
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Insira uma chave por linha. O sistema distribui as mensagens entre as chaves e, caso alguma atinja o limite temporário de requisições por minuto, pula automaticamente para a próxima.
              </p>
            </div>

            <textarea
              rows={8}
              value={keysText}
              onChange={(e) => setKeysText(e.target.value)}
              placeholder="AIzaSyCHGG9m1yJJy1ffn5OXnF4QtH4GkQU8sWo&#10;AIzaSyDTq2Juy_-GBmUqUENkaMuEIT9pDaIpnyY..."
              className="w-full text-xs p-4 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 font-mono text-stone-700 leading-relaxed"
            />

            <div className="text-[11px] text-stone-500 flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{keysText.split('\n').filter(k => k.trim().length > 10).length} chaves ativas</strong> configuradas no pool de rotação.
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 fill-stone-950" />
              <span>{savingSettings ? 'Salvando Configurações...' : 'Salvar Configurações da IA'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
