import React from 'react';
import logoIconLight from '../assets/logo-icon.png';
import logoIconDark from '../assets/logo-icon-dark.png';

export default function Logo({ 
  variant = 'light', 
  size = 'md', 
  showText = true, 
  className = '' 
}) {
  const sizeMap = {
    sm: { img: 'h-9 w-9 sm:h-10 sm:w-10', text: 'text-base sm:text-lg', sub: 'text-[8px] sm:text-[9px]' },
    md: { img: 'h-11 w-11 sm:h-12 sm:w-12', text: 'text-lg sm:text-xl', sub: 'text-[9px] sm:text-[10px]' },
    lg: { img: 'h-14 w-14 sm:h-16 sm:w-16', text: 'text-2xl sm:text-3xl', sub: 'text-[11px] sm:text-xs' },
    xl: { img: 'h-20 w-20 sm:h-24 sm:w-24', text: 'text-3xl sm:text-4xl', sub: 'text-xs sm:text-sm' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = variant === 'dark';
  const selectedIcon = isDark ? logoIconDark : logoIconLight;

  if (variant === 'icon') {
    return (
      <img
        src={selectedIcon}
        alt="Pousada Monte Alto Emblema"
        className={`${currentSize.img} object-contain transition-all duration-300 ${
          isDark ? 'drop-shadow-sm' : 'drop-shadow-md'
        } ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      {/* High Contrast Emblem based on background */}
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src={selectedIcon}
          alt="Emblema Pousada Monte Alto"
          className={`${currentSize.img} object-contain transition-all duration-300 group-hover:scale-105 ${
            isDark ? 'drop-shadow-sm' : 'drop-shadow-md'
          }`}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold tracking-tight leading-none transition-colors duration-300 ${
            isDark ? 'text-stone-900' : 'text-white'
          } ${currentSize.text}`}>
            Pousada Monte Alto
          </span>
          <span className={`tracking-[0.2em] uppercase font-bold mt-1 transition-colors duration-300 ${
            isDark ? 'text-amber-700' : 'text-amber-400'
          } ${currentSize.sub}`}>
            Arraial do Cabo • RJ
          </span>
        </div>
      )}
    </div>
  );
}
