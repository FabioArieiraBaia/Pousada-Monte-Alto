import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, PawPrint, Search, Sparkles } from 'lucide-react';

export default function AvailabilitySearchBar({ onSearch, initialValues = {} }) {
  const { t } = useTranslation();
  
  // Default dates: tomorrow to +3 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkoutDefault = new Date();
  checkoutDefault.setDate(checkoutDefault.getDate() + 4);

  const formatDateInput = (date) => date.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialValues.check_in || formatDateInput(tomorrow));
  const [checkOut, setCheckOut] = useState(initialValues.check_out || formatDateInput(checkoutDefault));
  const [guests, setGuests] = useState(initialValues.guests || 2);
  const [pets, setPets] = useState(initialValues.pets || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ check_in: checkIn, check_out: checkOut, guests, pets });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-stone-200/80 max-w-5xl mx-auto text-stone-800"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        
        {/* Check-in */}
        <div className="bg-sand-50/80 p-3 rounded-2xl border border-sand-200/80 hover:border-amber-400 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('hero.searchCheckIn')}</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer"
            required
          />
        </div>

        {/* Check-out */}
        <div className="bg-sand-50/80 p-3 rounded-2xl border border-sand-200/80 hover:border-amber-400 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('hero.searchCheckOut')}</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer"
            required
          />
        </div>

        {/* Guests & Pets */}
        <div className="bg-sand-50/80 p-3 rounded-2xl border border-sand-200/80 hover:border-amber-400 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('hero.searchGuests')}</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value={1}>1 Pessoa</option>
              <option value={2}>2 Pessoas</option>
              <option value={3}>3 Pessoas</option>
              <option value={4}>4 Pessoas</option>
              <option value={5}>5+ Pessoas</option>
            </select>
          </div>

          {/* Pet Friendly Checkbox */}
          <label className="flex items-center gap-2 mt-2 pt-1 border-t border-sand-200/50 cursor-pointer">
            <input
              type="checkbox"
              checked={pets}
              onChange={(e) => setPets(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-stone-700 flex items-center gap-1">
              <PawPrint className="w-3 h-3 text-emerald-600" />
              {t('hero.searchPets')}
            </span>
          </label>
        </div>

        {/* Search Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-stone-950 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs sm:text-sm"
          >
            <Search className="w-4 h-4" />
            <span>{t('hero.searchButton')}</span>
          </button>
        </div>

      </div>
    </form>
  );
}
