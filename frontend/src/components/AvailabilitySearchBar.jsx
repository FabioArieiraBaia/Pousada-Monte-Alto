import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Users, PawPrint, Search, 
  Sparkles, Check, ChevronDown 
} from 'lucide-react';

export default function AvailabilitySearchBar({ onSearch }) {
  const { t } = useTranslation();

  // Default dates: tomorrow to +3 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkoutDefault = new Date();
  checkoutDefault.setDate(checkoutDefault.getDate() + 4);

  const [checkIn, setCheckIn] = useState(tomorrow.toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(checkoutDefault.toISOString().split('T')[0]);
  const [guests, setGuests] = useState(2);
  const [withPets, setWithPets] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        check_in: checkIn,
        check_out: checkOut,
        guests: Number(guests),
        pets: withPets
      });
    }
  };

  // Helper for quick shortcuts
  const applyShortcut = (type) => {
    setActiveShortcut(type);
    const today = new Date();
    
    if (type === 'weekend') {
      // Find next Friday
      const friday = new Date(today);
      const day = friday.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      friday.setDate(friday.getDate() + diff);
      
      const sunday = new Date(friday);
      sunday.setDate(sunday.getDate() + 2);

      setCheckIn(friday.toISOString().split('T')[0]);
      setCheckOut(sunday.toISOString().split('T')[0]);
    } else if (type === 'couple') {
      setGuests(2);
      setWithPets(false);
    } else if (type === 'family_pet') {
      setGuests(4);
      setWithPets(true);
    } else if (type === 'week') {
      const start = new Date(today);
      start.setDate(start.getDate() + 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      setCheckIn(start.toISOString().split('T')[0]);
      setCheckOut(end.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      
      {/* Quick Stay Suggestions Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] font-semibold text-stone-300 hidden sm:inline-block mr-1">
          Sugestões rápidas:
        </span>
        <button
          type="button"
          onClick={() => applyShortcut('weekend')}
          className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
            activeShortcut === 'weekend'
              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
              : 'bg-stone-900/60 hover:bg-stone-900/90 border-white/20 text-stone-200'
          }`}
        >
          🏖️ Próximo Fim de Semana
        </button>

        <button
          type="button"
          onClick={() => applyShortcut('couple')}
          className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
            activeShortcut === 'couple'
              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
              : 'bg-stone-900/60 hover:bg-stone-900/90 border-white/20 text-stone-200'
          }`}
        >
          💑 Pacote Casal
        </button>

        <button
          type="button"
          onClick={() => applyShortcut('family_pet')}
          className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
            activeShortcut === 'family_pet'
              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
              : 'bg-stone-900/60 hover:bg-stone-900/90 border-white/20 text-stone-200'
          }`}
        >
          🐾 Família + Pet Friendly
        </button>
      </div>

      {/* Main Glassmorphic Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/60 text-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
      >
        {/* Check-In */}
        <div className="lg:col-span-3 bg-sand-50/90 hover:bg-sand-100/90 p-3 rounded-2xl border border-stone-200/80 transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('search.checkin')}</span>
          </label>
          <input
            type="date"
            required
            value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Check-Out */}
        <div className="lg:col-span-3 bg-sand-50/90 hover:bg-sand-100/90 p-3 rounded-2xl border border-stone-200/80 transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('search.checkout')}</span>
          </label>
          <input
            type="date"
            required
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Guests & Pet Toggle */}
        <div className="lg:col-span-3 bg-sand-50/90 hover:bg-sand-100/90 p-3 rounded-2xl border border-stone-200/80 transition-all">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('search.guests')}</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
            >
              <option value="1">1 Pessoa</option>
              <option value="2">2 Pessoas</option>
              <option value="3">3 Pessoas</option>
              <option value="4">4 Pessoas</option>
              <option value="5">5+ Pessoas</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 mt-1 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={withPets}
              onChange={(e) => setWithPets(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-stone-700 flex items-center gap-1">
              <PawPrint className="w-3 h-3 text-emerald-600" />
              Viajando com Pet 🐾
            </span>
          </label>
        </div>

        {/* Search Submit CTA */}
        <div className="lg:col-span-3">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold py-4 px-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{t('search.submit')}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
