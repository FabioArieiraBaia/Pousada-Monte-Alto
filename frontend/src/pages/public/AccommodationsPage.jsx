import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, PawPrint, BedDouble, SlidersHorizontal, Sparkles, Calendar } from 'lucide-react';
import RoomCard from '../../components/RoomCard';
import BookingModal from '../../components/BookingModal';
import SEOHead from '../../components/SEOHead';
import { api } from '../../services/api';

export default function AccommodationsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Reactively track petFilter from query params or UI state
  const isPetInQuery = searchParams.get('pets') === 'true' || searchParams.get('pets') === '1';
  const [petFilter, setPetFilter] = useState(isPetInQuery);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  // Sync state when URL params change
  useEffect(() => {
    const hasPetParam = searchParams.get('pets') === 'true' || searchParams.get('pets') === '1';
    setPetFilter(hasPetParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');
    const guests = Number(searchParams.get('guests')) || 1;
    const pets = searchParams.get('pets') === 'true' || searchParams.get('pets') === '1';

    if (checkIn && checkOut) {
      api.checkAvailability(checkIn, checkOut, guests, pets)
        .then(res => setRooms(res.data || []))
        .catch(() => {
          return api.getAccommodations(true).then(res => setRooms(res.data || []));
        })
        .finally(() => setLoading(false));
    } else {
      api.getAccommodations(true)
        .then(res => setRooms(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  // Strict filtering
  const filteredRooms = rooms.filter((room) => {
    if (typeFilter !== 'all' && room.type !== typeFilter) return false;
    
    // Strict Pet Friendly Check: room must have accepts_pets equal to 1 or true
    if (petFilter) {
      const isPetFriendly = Number(room.accepts_pets) === 1 || room.accepts_pets === true || room.accepts_pets === '1';
      if (!isPetFriendly) return false;
    }
    
    return true;
  });

  const togglePetFilter = (checked) => {
    setPetFilter(checked);
    const newParams = new URLSearchParams(searchParams);
    if (checked) {
      newParams.set('pets', 'true');
    } else {
      newParams.delete('pets');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      <SEOHead
        title="Suítes e Lofts Pé na Areia"
        description="Conheça nossas acomodações em Arraial do Cabo: Suítes com hidromassagem, vista para o mar e Lofts familiares com cozinha completa e pet friendly 🐾."
      />

      {/* Page Header (Luminous on Dark/Video Background) */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block drop-shadow-sm">
          Hospedagem em Arraial do Cabo
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white drop-shadow-2xl">
          Suítes & Lofts Exclusivos
        </h1>
        <p className="text-stone-200 text-sm sm:text-base leading-relaxed drop-shadow-md">
          Cada acomodação na Pousada Monte Alto foi pensada para oferecer máximo conforto, privacidade e relaxamento à beira-mar.
        </p>
      </div>

      {/* Filter Bar (Glass Floating Container) */}
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              typeFilter === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todas as Opções ({rooms.length})
          </button>
          <button
            onClick={() => setTypeFilter('suite')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              typeFilter === 'suite'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Suítes
          </button>
          <button
            onClick={() => setTypeFilter('loft')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              typeFilter === 'loft'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Lofts / Família
          </button>
        </div>

        {/* Pet Friendly Checkbox */}
        <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-2xl border transition-all ${
          petFilter 
            ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm' 
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
        }`}>
          <input
            type="checkbox"
            checked={petFilter}
            onChange={(e) => togglePetFilter(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-stone-300 cursor-pointer"
          />
          <span className="text-xs flex items-center gap-1.5">
            <PawPrint className="w-3.5 h-3.5" />
            Apenas Pet Friendly 🐾
          </span>
        </label>
      </div>

      {/* Accommodations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 bg-white/20 backdrop-blur-md rounded-3xl animate-pulse border border-white/20" />
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
        <div className="text-center py-16 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/50 space-y-4 shadow-xl">
          <BedDouble className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            Nenhuma acomodação encontrada
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
            Não encontramos quartos com os filtros selecionados. Tente desmarcar o filtro de pets ou escolher outra data.
          </p>
          <button
            onClick={() => {
              setTypeFilter('all');
              togglePetFilter(false);
            }}
            className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-amber-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          initialDates={{
            check_in: searchParams.get('check_in') || '',
            check_out: searchParams.get('check_out') || '',
            guests: Number(searchParams.get('guests')) || 2,
            pets: petFilter
          }}
          isOpen={!!selectedRoomForBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}

    </div>
  );
}
