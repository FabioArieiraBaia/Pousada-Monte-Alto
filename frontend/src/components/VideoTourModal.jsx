import React from 'react';
import { X, Video, Sparkles, MapPin } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';

export default function VideoTourModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-stone-950 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Tour Virtual da Pousada Monte Alto
              </h3>
              <span className="text-[10px] text-stone-400 block">
                Arraial do Cabo • Entre o Mar e a Lagoa de Araruama
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="p-4 sm:p-6 bg-black">
          <YouTubeEmbed
            url="https://www.youtube.com/watch?v=0kH8s4Ue7w8"
            title="Tour Virtual Pousada Monte Alto"
          />
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-stone-950/80 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Praia de Monte Alto, Arraial do Cabo - RJ
          </span>

          <a
            href="https://wa.me/5521969493569?text=Ol%C3%A1!%20Acabei%20de%20assistir%20ao%20tour%20virtual%20da%20Pousada%20Monte%20Alto%20e%20gostaria%20de%20saber%20valores%20para%20minha%20viagem."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Reservar via WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
}
