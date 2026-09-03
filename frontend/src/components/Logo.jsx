import React from 'react';
import logoImg from '../assets/logo.png';
import logoDarkImg from '../assets/logo-dark.png';
import logoIconImg from '../assets/logo-icon.png';

export default function Logo({ 
  variant = 'light', 
  size = 'md', 
  showText = true, 
  className = '' 
}) {
  // Size presets
  const sizeMap = {
    sm: { img: 'h-8 sm:h-9', text: 'text-base sm:text-lg', sub: 'text-[8px] sm:text-[9px]' },
    md: { img: 'h-10 sm:h-12', text: 'text-lg sm:text-xl', sub: 'text-[9px] sm:text-[10px]' },
    lg: { img: 'h-14 sm:h-16', text: 'text-2xl sm:text-3xl', sub: 'text-[11px] sm:text-xs' },
    xl: { img: 'h-20 sm:h-24', text: 'text-3xl sm:text-4xl', sub: 'text-xs sm:text-sm' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === 'icon') {
    return (
      <img
        src={logoIconImg}
        alt="Pousada Monte Alto - Tartaruga"
        className={`${currentSize.img} w-auto object-contain drop-shadow-sm ${className}`}
      />
    );
  }

  const selectedImg = variant === 'dark' ? logoDarkImg : logoImg;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      <img
        src={selectedImg}
        alt="Pousada Monte Alto Logomarca"
        className={`${currentSize.img} w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold tracking-tight leading-tight ${
            variant === 'dark' ? 'text-stone-900' : 'text-white'
          } ${currentSize.text}`}>
            Pousada Monte Alto
          </span>
          <span className={`tracking-widest uppercase font-semibold text-amber-500 ${currentSize.sub}`}>
            Arraial do Cabo • RJ
          </span>
        </div>
      )}
    </div>
  );
}
