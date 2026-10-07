import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Compass, Anchor, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, DollarSign, Calendar, Clock, Users, MessageCircle, 
  ExternalLink, Download, Search, Filter, ShieldCheck, Video, 
  Image as ImageIcon, Sparkles, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Tag, X, Check, Power, Upload,
  Briefcase, BarChart3, Layers, AlertTriangle,
  Camera, Images, Eye
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/SocialIcons';
import { api } from '../../services/api';

export default function AdminServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'catalog'; // 'catalog' | 'bookings' | 'finance'

  // --- CATALOG STATE ---
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [savingService, setSavingService] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const initialServiceForm = {
    category: 'barco',
    name_pt: '',
    name_en: '',
    name_es: '',
    tagline_pt: '',
    tagline_en: '',
    tagline_es: '',
    description_pt: '',
    description_en: '',
    description_es: '',
    duration_label: '3 horas',
    price_per_person: 150,
    partner_name: '',
    partner_commission_pct: 20,
    partner_cost: 120,
    min_participants: 1,
    max_participants: 10,
    included_items: ['Colete salva-vidas', 'Água mineral', 'Guia credenciado'],
    requirements: ['Chegar com 15 min de antecedência', 'Protetor solar'],
    cover_photo: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    gallery_photos: [],
    youtube_video_url: '',
    instagram_video_url: '',
    facebook_video_url: '',
    is_featured: 1,
    is_active: 1
  };

  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newRequirementItem, setNewRequirementItem] = useState('');

  // --- BOOKINGS STATE ---
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingMonthFilter, setBookingMonthFilter] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    service_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_date: new Date().toISOString().split('T')[0],
    service_time: '09:00',
    participants_count: 2,
    unit_price: 150,
    total_price: 300,
    status: 'confirmed',
    payment_status: 'paid',
    notes: ''
  });

  // Cancel Booking Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelRefundAmount, setCancelRefundAmount] = useState(0);
  const [cancelReason, setCancelReason] = useState('Cancelamento a pedido do cliente');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // --- FINANCE STATE ---
  const [financeMonth, setFinanceMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [financeSummary, setFinanceSummary] = useState(null);
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    type: 'income',
    category: 'reserva_servico',
    amount: '',
    payment_method: 'pix',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'completed',
    service_id: ''
  });

  // Initial Load
  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'finance') {
      loadFinanceData();
    }
  }, [activeTab, financeMonth, bookingStatusFilter, bookingMonthFilter]);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const res = await api.getServices(false);
      setServices(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.getServiceBookings(bookingMonthFilter, bookingStatusFilter);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadFinanceData = async () => {
    setLoadingFinance(true);
    try {
      const [sumRes, transRes] = await Promise.all([
        api.getServiceFinanceSummary(financeMonth),
        api.getServiceFinanceTransactions(null, financeMonth)
      ]);
      setFinanceSummary(sumRes.summary || null);
      setFinanceTransactions(transRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar financeiro de serviços:', err);
    } finally {
      setLoadingFinance(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // --- CATALOG HANDLERS ---
  const handleOpenServiceModal = (s = null) => {
    if (s) {
      setEditingService(s);
      setServiceForm({
        ...s,
        included_items: s.included_items || [],
        requirements: s.requirements || [],
        gallery_photos: s.gallery_photos || [],
        youtube_video_url: s.youtube_video_url || '',
        instagram_video_url: s.instagram_video_url || '',
        facebook_video_url: s.facebook_video_url || ''
      });
    } else {
      setEditingService(null);
      setServiceForm(initialServiceForm);
    }
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setSavingService(true);
    try {
      if (editingService) {
        await api.updateService(editingService.id, serviceForm);
      } else {
        await api.createService(serviceForm);
      }
      setServiceModalOpen(false);
      loadServices();
    } catch (err) {
      alert(err.message || 'Erro ao salvar serviço');
    } finally {
      setSavingService(false);
    }
  };

  const handleToggleService = async (id) => {
    try {
      await api.toggleService(id);
      loadServices();
    } catch (err) {
      alert(err.message || 'Erro ao alternar status do serviço');
    }
  };

  const handleDeleteService = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja excluir o passeio "${name}"? Todas as fotos e dados serão removidos.`)) {
      try {
        await api.deleteService(id);
        loadServices();
      } catch (err) {
        alert(err.message || 'Erro ao excluir serviço');
      }
    }
  };

  const handleUploadCoverPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadImage(file);
      if (res.url) {
        setServiceForm(prev => ({ ...prev, cover_photo: res.url }));
      }
    } catch (err) {
      alert('Erro no upload da imagem: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadGalleryPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const uploadPromises = files.map(file => api.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url).filter(Boolean);
      setServiceForm(prev => ({
        ...prev,
        gallery_photos: [...(prev.gallery_photos || []), ...newUrls]
      }));
    } catch (err) {
      alert('Erro ao enviar fotos da galeria: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleRemoveGalleryPhoto = (index) => {
    setServiceForm(prev => {
      const updated = [...(prev.gallery_photos || [])];
      updated.splice(index, 1);
      return { ...prev, gallery_photos: updated };
    });
  };

  const handleSetPhotoAsCover = (url) => {
    setServiceForm(prev => ({
      ...prev,
      cover_photo: url
    }));
  };

  const handleAddGalleryUrl = () => {
    if (newGalleryUrl.trim()) {
      setServiceForm(prev => ({
        ...prev,
        gallery_photos: [...(prev.gallery_photos || []), newGalleryUrl.trim()]
      }));
      setNewGalleryUrl('');
    }
  };

  // --- BOOKINGS HANDLERS ---
  const handleUpdateBookingStatus = async (id, status, payment_status) => {
    try {
      await api.updateServiceBookingStatus(id, status, payment_status);
      loadBookings();
    } catch (err) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleOpenCancelModal = (b) => {
    setBookingToCancel(b);
    setCancelRefundAmount(b.total_price);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setSubmittingCancel(true);
    try {
      await api.cancelServiceBooking(bookingToCancel.id, {
        refund_amount: cancelRefundAmount,
        refund_reason: cancelReason
      });
      setCancelModalOpen(false);
      loadBookings();
    } catch (err) {
      alert(err.message || 'Erro ao cancelar agendamento');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento #S${id}?`)) {
      try {
        await api.deleteServiceBooking(id);
        loadBookings();
      } catch (err) {
        alert(err.message || 'Erro ao excluir agendamento');
      }
    }
  };

  const handleOpenWhatsApp = async (id) => {
    try {
      const res = await api.getServiceBookingWhatsAppLink(id);
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank');
      }
    } catch (err) {
      alert('Erro ao obter link do WhatsApp: ' + err.message);
    }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    setSavingBooking(true);
    try {
      await api.createAdminServiceBooking(bookingForm);
      setBookingModalOpen(false);
      loadBookings();
    } catch (err) {
      alert(err.message || 'Erro ao criar agendamento');
    } finally {
      setSavingBooking(false);
    }
  };

  // --- FINANCE HANDLERS ---
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setSavingTransaction(true);
    try {
      await api.createServiceFinanceTransaction(financeForm);
      setFinanceModalOpen(false);
      loadFinanceData();
    } catch (err) {
      alert(err.message || 'Erro ao salvar transação');
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Excluir este lançamento financeiro de serviço?')) {
      try {
        await api.deleteServiceFinanceTransaction(id);
        loadFinanceData();
      } catch (err) {
        alert(err.message || 'Erro ao excluir transação');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Módulo de Passeios & Serviços
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Gestão completa de experiências (barco, mergulho, buggy), agendamentos e controle financeiro de parceiros.
          </p>
        </div>

        {/* Global Action depending on Tab */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'catalog' && (
            <button
              onClick={() => handleOpenServiceModal()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Passeio / Serviço</span>
            </button>
          )}

          {activeTab === 'bookings' && (
            <button
              onClick={() => {
                if (services.length > 0) {
                  setBookingForm(prev => ({
                    ...prev,
                    service_id: services[0].id,
                    unit_price: services[0].price_per_person,
                    total_price: services[0].price_per_person * 2
                  }));
                }
                setBookingModalOpen(true);
              }}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Reserva Manual</span>
            </button>
          )}

          {activeTab === 'finance' && (
            <div className="flex items-center gap-2">
              <a
                href={api.getServiceFinanceExportCsvUrl(financeMonth)}
                download
                className="px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </a>

              <button
                onClick={() => setFinanceModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lançamento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation (Aba Serviços com Subabas) */}
      <div className="flex items-center gap-2 bg-stone-200/80 p-1.5 rounded-2xl max-w-fit">
        <button
          onClick={() => setSearchParams({ tab: 'catalog' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span>Catálogo de Passeios</span>
          <span className="ml-1 px-1.5 py-0.2 bg-stone-100 text-stone-600 text-[10px] rounded-full border border-stone-200">
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'bookings' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bookings'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Reservas & Agendamentos</span>
          <span className="ml-1 px-1.5 py-0.2 bg-stone-100 text-stone-600 text-[10px] rounded-full border border-stone-200">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'finance' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'finance'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Financeiro Exclusivo de Serviços</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-ABA 1: CATÁLOGO DE PASSEIOS & SERVIÇOS               */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {loadingServices ? (
            <div className="p-12 text-center text-stone-500 text-sm">Carregando catálogo de passeios...</div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <Compass className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">Nenhum passeio cadastrado</h3>
              <p className="text-stone-500 text-xs">Comece cadastrando seu primeiro passeio de barco, mergulho ou buggy.</p>
              <button
                onClick={() => handleOpenServiceModal()}
                className="px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow"
              >
                Cadastrar Passeio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-48 overflow-hidden bg-stone-100">
                      <img src={s.cover_photo} alt={s.name_pt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="bg-stone-900/85 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          {s.category.toUpperCase()}
                        </span>
                        <span className="bg-stone-900/85 backdrop-blur-md text-stone-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                          {s.duration_label || 'Passeio'}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleService(s.id)}
                          className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                            s.is_active === 1
                              ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                              : 'bg-red-500/90 text-white hover:bg-red-600'
                          }`}
                          title={s.is_active === 1 ? 'Passeio Ativo (clique para desativar)' : 'Passeio Desativado (clique para ativar)'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-serif font-bold text-base leading-snug truncate">
                          {s.name_pt}
                        </h3>
                        {s.partner_name && (
                          <span className="text-[11px] text-stone-300 block truncate">
                            Parceiro: {s.partner_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <p className="text-stone-600 text-xs line-clamp-2">
                        {s.tagline_pt || s.description_pt}
                      </p>

                      <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Preço / Pessoa:</span>
                          <span className="font-bold text-stone-900 text-sm">{formatCurrency(s.price_per_person)}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Comissão Pousada:</span>
                          <span className="font-bold text-emerald-600 text-sm">{s.partner_commission_pct}%</span>
                        </div>
                      </div>

                      {s.included_items && s.included_items.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Incluso:</span>
                          <div className="flex flex-wrap gap-1">
                            {s.included_items.slice(0, 3).map((item, i) => (
                              <span key={i} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                                {item}
                              </span>
                            ))}
                            {s.included_items.length > 3 && (
                              <span className="text-[10px] text-stone-400">+{s.included_items.length - 3} mais</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/servicos/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Visualizar Página Pública"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenServiceModal(s)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteService(s.id, s.name_pt)}
                        className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Excluir Passeio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 2: RESERVAS & AGENDAMENTOS                       */}
      {/* ======================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-500">Status:</span>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">⏳ Pendente</option>
                <option value="confirmed">✅ Confirmado</option>
                <option value="completed">🎉 Concluído</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-500">Mês:</span>
              <input
                type="month"
                value={bookingMonthFilter}
                onChange={(e) => setBookingMonthFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {bookingMonthFilter && (
                <button
                  onClick={() => setBookingMonthFilter('')}
                  className="text-xs text-stone-400 hover:text-stone-700 underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Bookings Table */}
          {loadingBookings ? (
            <div className="p-12 text-center text-stone-500 text-sm">Carregando agendamentos...</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <Calendar className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="text-base font-bold text-stone-800">Nenhum agendamento encontrado</h4>
              <p className="text-stone-500 text-xs">Os agendamentos feitos pelos visitantes aparecerão aqui.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Cód / Data</th>
                      <th className="py-3 px-4">Cliente / Contato</th>
                      <th className="py-3 px-4">Passeio / Parceiro</th>
                      <th className="py-3 px-4">Qtd. / Total</th>
                      <th className="py-3 px-4">Comissão Pousada</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                          <div>#S{b.id}</div>
                          <div className="text-[11px] font-sans text-stone-500 font-normal">
                            {new Date(b.service_date + 'T00:00:00').toLocaleDateString('pt-BR')} às {b.service_time}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{b.customer_name}</div>
                          <div className="text-[11px] text-stone-500">{b.customer_phone}</div>
                          {b.customer_email && <div className="text-[10px] text-stone-400">{b.customer_email}</div>}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-800">{b.service_name}</div>
                          <div className="text-[10px] text-amber-600 font-medium">Parceiro: {b.partner_name || 'Direto'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{formatCurrency(b.total_price)}</div>
                          <div className="text-[11px] text-stone-500">{b.participants_count} participante(s)</div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          <div>{formatCurrency(b.pousada_commission)}</div>
                          <div className="text-[10px] text-stone-400 font-normal">
                            Repasse parceiro: {formatCurrency(b.partner_cost)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status === 'confirmed' ? 'Confirmado' :
                             b.status === 'completed' ? 'Concluído' :
                             b.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                          </span>

                          <div className="text-[10px] text-stone-400">
                            {b.payment_status === 'paid' ? '💰 Pago' :
                             b.payment_status === 'refunded' ? '↩️ Reembolsado' : '⏳ Não pago'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* WhatsApp contact */}
                          <button
                            onClick={() => handleOpenWhatsApp(b.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 fill-current" />
                          </button>

                          {/* Quick status actions */}
                          {b.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed', 'paid')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold"
                              title="Confirmar e registrar receita no livro de passeios"
                            >
                              Confirmar
                            </button>
                          )}

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed', b.payment_status)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold"
                              title="Marcar como Concluído"
                            >
                              Concluir
                            </button>
                          )}

                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleOpenCancelModal(b)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                              title="Cancelar agendamento"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors inline-block"
                            title="Excluir agendamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 3: FINANCEIRO EXCLUSIVO DE SERVIÇOS & PARCEIROS   */}
      {/* ======================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Month Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Mês Selecionado:</span>
              <input
                type="month"
                value={financeMonth}
                onChange={(e) => setFinanceMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>

            <div className="text-xs text-stone-500 font-medium">
              💡 Este fluxo de caixa é <strong>100% exclusivo dos passeios e comissões</strong>, sem misturar com as diárias das suítes.
            </div>
          </div>

          {/* KPIs Cards */}
          {financeSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Faturamento Bruto */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Passeios</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-stone-900 font-serif">
                  {formatCurrency(financeSummary.month_income)}
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Receita total de reservas no mês</span>
              </div>

              {/* Card 2: Repasses a Parceiros */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Repasse a Operadores</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700 font-serif">
                  {formatCurrency(financeSummary.month_expense)}
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Custos pagos a barqueiros, mergulho e buggy</span>
              </div>

              {/* Card 3: Lucro Líquido da Pousada */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Comissão Líquida (Pousada)</span>
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 font-serif">
                  {formatCurrency(financeSummary.month_net_profit)}
                </div>
                <span className="text-[11px] text-emerald-600/90 font-semibold mt-1 block">
                  Margem de lucro: {financeSummary.profit_margin}%
                </span>
              </div>

              {/* Card 4: Histórico Total Acumulado */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Lucro Total Acumulado</span>
                  <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-stone-900 font-serif">
                  {formatCurrency(financeSummary.total_net_profit)}
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Histórico total desde o início</span>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-3 p-5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center justify-between">
              <span>Livro Caixa de Passeios & Serviços</span>
              <span className="text-xs font-normal text-stone-400">{financeTransactions.length} lançamentos</span>
            </h3>

            {loadingFinance ? (
              <div className="p-8 text-center text-stone-500 text-xs">Carregando lançamentos...</div>
            ) : financeTransactions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs bg-stone-50 rounded-xl">
                Nenhum lançamento financeiro de serviço registrado para este mês.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3">Descrição / Cliente</th>
                      <th className="py-2.5 px-3">Parceiro</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {financeTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.type === 'income' ? 'Receita' : 'Repasse / Despesa'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 capitalize text-[11px] text-stone-600">
                          {tx.category.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-stone-900">{tx.description}</div>
                          {tx.customer_name && (
                            <div className="text-[10px] text-stone-500">Cliente: {tx.customer_name}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-stone-600">
                          {tx.partner_name || '-'}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${tx.type === 'income' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CRIAR / EDITAR PASSEIO (CATÁLOGO)                */}
      {/* ======================================================== */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg">
                {editingService ? `Editar: ${editingService.name_pt}` : 'Cadastrar Novo Passeio / Serviço'}
              </h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="barco">⚓ Passeio de Barco / Escuna</option>
                    <option value="mergulho">🤿 Mergulho Subaquático & Snorkel</option>
                    <option value="buggy">🚙 Buggy & 4x4 Dunas</option>
                    <option value="quadriciclo">🏎️ Quadriciclo</option>
                    <option value="trilha">🥾 Trilhas & Mirantes</option>
                    <option value="outro">✨ Outra Experiência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Passeio (PT) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Passeio Tradicional de Barco"
                    value={serviceForm.name_pt}
                    onChange={(e) => setServiceForm({ ...serviceForm, name_pt: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome em Inglês (EN)</label>
                  <input
                    type="text"
                    placeholder="Ex: Brazilian Caribbean Boat Tour"
                    value={serviceForm.name_en}
                    onChange={(e) => setServiceForm({ ...serviceForm, name_en: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome em Espanhol (ES)</label>
                  <input
                    type="text"
                    placeholder="Ex: Paseo en Barco por el Caribe"
                    value={serviceForm.name_es}
                    onChange={(e) => setServiceForm({ ...serviceForm, name_es: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Frase de Destaque / Subtítulo</label>
                <input
                  type="text"
                  placeholder="Ex: Roteiro completo: Ilha do Farol, Prainhas do Pontal e Praia do Forno"
                  value={serviceForm.tagline_pt}
                  onChange={(e) => setServiceForm({ ...serviceForm, tagline_pt: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                />
              </div>

              {/* Pricing & Partners */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                  Precificação & Parceiro / Operador
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Preço p/ Pessoa (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={serviceForm.price_per_person}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        const comm = parseFloat(serviceForm.partner_commission_pct) || 0;
                        setServiceForm({
                          ...serviceForm,
                          price_per_person: p,
                          partner_cost: roundNumber(p * ((100 - comm) / 100))
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Comissão Pousada (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={serviceForm.partner_commission_pct}
                      onChange={(e) => {
                        const comm = parseFloat(e.target.value) || 0;
                        const p = parseFloat(serviceForm.price_per_person) || 0;
                        setServiceForm({
                          ...serviceForm,
                          partner_commission_pct: comm,
                          partner_cost: roundNumber(p * ((100 - comm) / 100))
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-xl bg-white text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Repasse Parceiro (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceForm.partner_cost}
                      onChange={(e) => setServiceForm({ ...serviceForm, partner_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-xl bg-white text-amber-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Nome do Parceiro / Empresa</label>
                    <input
                      type="text"
                      placeholder="Ex: Escuna Arraial Tour / Buggyzeiro Carlinhos"
                      value={serviceForm.partner_name}
                      onChange={(e) => setServiceForm({ ...serviceForm, partner_name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Duração Estimada</label>
                    <input
                      type="text"
                      placeholder="Ex: 4 horas / 2h30 min"
                      value={serviceForm.duration_label}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_label: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Foto de Capa Principal */}
              <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                <label className="block text-xs font-bold text-stone-700">Foto de Capa Principal *</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 relative">
                    <img src={serviceForm.cover_photo} alt="capa" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-stone-950/70 text-[9px] text-amber-400 font-bold text-center py-0.5">
                      CAPA
                    </span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="URL da foto de capa"
                      value={serviceForm.cover_photo}
                      onChange={(e) => setServiceForm({ ...serviceForm, cover_photo: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Enviando...' : 'Trocar Foto de Capa'}</span>
                      <input type="file" accept="image/*" onChange={handleUploadCoverPhoto} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 📸 Galeria de Fotos Exclusiva do Passeio (Multi-upload) */}
              <div className="space-y-3 p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-amber-600" />
                      <span>Galeria de Fotos do Passeio</span>
                      <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-800">
                        {serviceForm.gallery_photos?.length || 0} fotos
                      </span>
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Você pode selecionar várias fotos de uma vez para fazer upload.
                    </p>
                  </div>

                  {/* Multi-upload Button */}
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm shrink-0 self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingGallery ? 'Enviando Fotos...' : '+ Upar Várias Fotos'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleUploadGalleryPhotos} 
                      disabled={uploadingGallery}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Quick URL Adder for Gallery */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ou cole o link de uma imagem externa..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-xl text-xs font-semibold hover:bg-stone-700"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Gallery Thumbnails Grid */}
                {serviceForm.gallery_photos && serviceForm.gallery_photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
                    {serviceForm.gallery_photos.map((photoUrl, idx) => {
                      const isCover = serviceForm.cover_photo === photoUrl;
                      return (
                        <div 
                          key={idx} 
                          className={`group relative h-20 rounded-xl overflow-hidden border-2 bg-stone-900 transition-all ${
                            isCover ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <img src={photoUrl} alt={`foto ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {isCover && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                              CAPA
                            </span>
                          )}

                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetPhotoAsCover(photoUrl)}
                                className="text-[9px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded shadow hover:bg-amber-400 w-full truncate"
                                title="Definir como foto de capa principal"
                              >
                                Virar Capa
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryPhoto(idx)}
                              className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded shadow hover:bg-red-500 flex items-center justify-center gap-1 w-full"
                              title="Remover da galeria"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-stone-300 rounded-xl text-stone-500 text-xs bg-white/60">
                    Nenhuma foto adicional na galeria deste passeio ainda. Clique no botão acima para enviar fotos.
                  </div>
                )}
              </div>

              {/* 🎥 Vídeos e Redes Sociais (YouTube, Instagram, Facebook) */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Video className="w-4 h-4 text-amber-500" />
                  <span>Vídeos do Passeio & Redes Sociais</span>
                </h4>

                <div className="space-y-2.5">
                  {/* YouTube & YouTube Shorts */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        <span>Link do Vídeo ou Shorts no YouTube</span>
                      </span>
                      <span className="text-[10px] text-amber-600 font-normal bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                        Suporta Vídeo normal e Shorts
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/shorts/... ou https://www.youtube.com/watch?v=..."
                      value={serviceForm.youtube_video_url}
                      onChange={(e) => setServiceForm({ ...serviceForm, youtube_video_url: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                      <span>Link do Vídeo / Reels no Instagram</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.instagram.com/reel/... ou post"
                      value={serviceForm.instagram_video_url}
                      onChange={(e) => setServiceForm({ ...serviceForm, instagram_video_url: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                      <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Link do Vídeo ou Publicação no Facebook</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.facebook.com/.../videos/..."
                      value={serviceForm.facebook_video_url}
                      onChange={(e) => setServiceForm({ ...serviceForm, facebook_video_url: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Descrição Completa do Roteiro (PT) *</label>
                <textarea
                  rows="3"
                  required
                  value={serviceForm.description_pt}
                  onChange={(e) => setServiceForm({ ...serviceForm, description_pt: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                  placeholder="Detalhe os pontos de parada, o que o visitante vai conhecer, etc."
                />
              </div>

              {/* Included items */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Itens Inclusos</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {serviceForm.included_items.map((item, idx) => (
                    <span key={idx} className="bg-stone-100 text-stone-800 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...serviceForm.included_items];
                          updated.splice(idx, 1);
                          setServiceForm({ ...serviceForm, included_items: updated });
                        }}
                        className="text-stone-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar item (ex: Colete salva-vidas)"
                    value={newIncludedItem}
                    onChange={(e) => setNewIncludedItem(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newIncludedItem.trim()) {
                        setServiceForm({
                          ...serviceForm,
                          included_items: [...serviceForm.included_items, newIncludedItem.trim()]
                        });
                        setNewIncludedItem('');
                      }
                    }}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-xl text-xs font-bold"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {savingService ? 'Salvando...' : 'Salvar Passeio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CRIAR RESERVA MANUAL (ADMIN)                     */}
      {/* ======================================================== */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">Nova Reserva Manual de Passeio</h3>
              <button onClick={() => setBookingModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Selecione o Passeio *</label>
                <select
                  required
                  value={bookingForm.service_id}
                  onChange={(e) => {
                    const sid = parseInt(e.target.value);
                    const s = services.find(x => x.id === sid);
                    const uPrice = s ? s.price_per_person : 150;
                    setBookingForm({
                      ...bookingForm,
                      service_id: sid,
                      unit_price: uPrice,
                      total_price: uPrice * bookingForm.participants_count
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name_pt} (R$ {s.price_per_person}/pessoa)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customer_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customer_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.service_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, service_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Horário</label>
                  <input
                    type="text"
                    value={bookingForm.service_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, service_time: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Participantes</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.participants_count}
                    onChange={(e) => {
                      const count = Math.max(1, parseInt(e.target.value) || 1);
                      setBookingForm({
                        ...bookingForm,
                        participants_count: count,
                        total_price: count * bookingForm.unit_price
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Status da Reserva</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="confirmed">Confirmada</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Status do Pagamento</label>
                  <select
                    value={bookingForm.payment_status}
                    onChange={(e) => setBookingForm({ ...bookingForm, payment_status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="paid">Pago (Gera lançamento no financeiro)</option>
                    <option value="unpaid">Não Pago</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">Total a Lançar:</span>
                <span className="text-base font-black text-emerald-700">{formatCurrency(bookingForm.total_price)}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  {savingBooking ? 'Salvando...' : 'Salvar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CANCELAMENTO COM REEMBOLSO                       */}
      {/* ======================================================== */}
      {cancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancelar Agendamento #S{bookingToCancel.id}</span>
            </div>

            <p className="text-xs text-stone-600">
              Deseja realmente cancelar a reserva de <strong>{bookingToCancel.customer_name}</strong> para o passeio <strong>{bookingToCancel.service_name}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Valor do Reembolso (R$)</label>
              <input
                type="number"
                step="0.01"
                value={cancelRefundAmount}
                onChange={(e) => setCancelRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
              />
              <span className="text-[10px] text-stone-400">Total pago originalmente: {formatCurrency(bookingToCancel.total_price)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Motivo do Cancelamento</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-xl text-xs"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
                className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {submittingCancel ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO LANÇAMENTO MANUAL DE SERVIÇOS               */}
      {/* ======================================================== */}
      {financeModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Novo Lançamento Financeiro de Serviço</h3>
              <button onClick={() => setFinanceModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Tipo</label>
                  <select
                    value={financeForm.type}
                    onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="income">Receita (Entrada)</option>
                    <option value="expense">Despesa / Repasse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="reserva_servico">Reserva de Serviço</option>
                    <option value="repasse_parceiro">Repasse a Parceiro</option>
                    <option value="taxa_marinha">Taxa de Embarque / Marinha</option>
                    <option value="manutencao">Manutenção / Equipamento</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={financeForm.transaction_date}
                    onChange={(e) => setFinanceForm({ ...financeForm, transaction_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento referente ao passeio de escuna"
                  value={financeForm.description}
                  onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFinanceModalOpen(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTransaction}
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  {savingTransaction ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function roundNumber(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
