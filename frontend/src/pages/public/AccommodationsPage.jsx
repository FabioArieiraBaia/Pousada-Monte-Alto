import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, PawPrint, BedDouble, SlidersHorizontal, Sparkles } from 'lucide-react';
import RoomCard from '../../components/RoomCard';
import BookingModal from '../../components/BookingModal';
import { api } from '../../services/api';

export default function AccommodationsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all, suite, loft
  const [petFilter, setPetFilter] = useState(searchParams.get('pets') === 'true');
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getAccommodations(true)
      .then(res => {
        setRooms(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (typeFilter !== 'all' && room.type !== typeFilter) return false;
    if (petFilter && room.accepts_pets != 1) return false;
    return true;
  });

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">
          Hospedagem em Arraial do Cabo
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900">
          Suítes & Lofts Exclusivos
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Cada acomodação na Pousada Monte Alto foi pensada para oferecer máximo conforto, privacidade e relaxamento à beira-mar.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
        
        {/* Type Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              typeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todas as Opções ({rooms.length})
          </button>
          <button
            onClick={() => setTypeFilter('suite')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              typeFilter === 'suite'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Suítes
          </button>
          <button
            onClick={() => setTypeFilter('loft')}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              typeFilter === 'loft'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Lofts / Família
          </button>
        </div>

        {/* Pet Filter Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-sand-50 px-3.5 py-2 rounded-2xl border border-sand-200 hover:border-amber-400 transition-colors">
          <input
            type="checkbox"
            checked={petFilter}
            onChange={(e) => setPetFilter(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300"
          />
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
            Apenas Pet Friendly 🐾
          </span>
        </label>
      </div>

      {/* Accommodations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 bg-stone-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onOpenBooking={(r) => setSelectedRoomForBooking(r)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-stone-200/80">
          <BedDouble className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-stone-800">
            Nenhuma acomodação encontrada
          </h3>
          <p className="text-stone-500 text-xs">
            Tente ajustar os filtros de busca acima.
          </p>
        </div>
      )}

      {/* Booking Modal */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          initialDates={{
            check_in: searchParams.get('check_in'),
            check_out: searchParams.get('check_out'),
            guests: Number(searchParams.get('guests')) || 2,
            pets: searchParams.get('pets') === 'true'
          }}
          isOpen={!!selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}

    </div>
  );
}
