import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, X, Globe, MessageCircle, Calendar, 
  MapPin, Phone, ShieldCheck, Sun, Waves, Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setLangMenuOpen(false);
  }, [location.pathname]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/acomodacoes', label: t('nav.accommodations') },
    { to: '/sobre-localizacao', label: t('nav.about') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/contato', label: t('nav.contact') },
  ];

  const languages = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find(l => l.code === (i18n.language || 'pt').substring(0, 2)) || languages[0];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-md py-3 text-stone-800' 
        : 'bg-gradient-to-b from-stone-900/70 via-stone-900/30 to-transparent py-5 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
            <Waves className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide block leading-tight">
              Pousada Monte Alto
            </span>
            <span className={`text-[10px] tracking-widest uppercase font-medium block ${
              scrolled ? 'text-stone-500' : 'text-stone-300'
            }`}>
              Arraial do Cabo • RJ
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-amber-500 relative py-1 ${
                  isActive 
                    ? 'text-amber-500 font-semibold' 
                    : scrolled ? 'text-stone-700' : 'text-stone-100'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Lang + WhatsApp + CTA */}
        <div className="hidden md:flex items-center gap-3.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                scrolled 
                  ? 'border-stone-300 text-stone-700 hover:bg-stone-100' 
                  : 'border-white/30 text-white hover:bg-white/10'
              }`}
            >
              <span>{currentLang.flag}</span>
              <span className="uppercase">{currentLang.code}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-stone-100 py-1.5 z-50 text-stone-800">
                {languages.map((lng) => (
                  <button
                    key={lng.code}
                    onClick={() => changeLanguage(lng.code)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-amber-50 transition-colors ${
                      i18n.language.startsWith(lng.code) ? 'text-amber-600 font-semibold bg-amber-50/50' : ''
                    }`}
                  >
                    <span>{lng.flag}</span>
                    <span>{lng.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/5521969493569?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20as%20su%C3%ADtes%20da%20Pousada%20Monte%20Alto."
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full border transition-colors ${
              scrolled 
                ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-50' 
                : 'border-emerald-400/50 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title="WhatsApp Pousada Monte Alto"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          {/* Book Now Button */}
          <Link
            to="/acomodacoes"
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('nav.bookNow')}</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Quick Lang toggle on mobile */}
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="text-xs px-2 py-1 rounded-md border border-white/30 flex items-center gap-1"
          >
            <span>{currentLang.flag}</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg ${scrolled ? 'text-stone-800' : 'text-white'}`}
            aria-label="Abrir Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-stone-900/95 backdrop-blur-xl border-t border-white/10 text-white px-6 py-6 space-y-4 animate-fade-in shadow-2xl">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-base font-medium text-stone-200 hover:text-amber-400 py-1.5 border-b border-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <span className="text-xs text-stone-400">Idioma / Language:</span>
              <div className="flex gap-2">
                {languages.map((lng) => (
                  <button
                    key={lng.code}
                    onClick={() => changeLanguage(lng.code)}
                    className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1 border ${
                      i18n.language.startsWith(lng.code) 
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400 font-bold' 
                        : 'border-white/20 text-stone-300'
                    }`}
                  >
                    <span>{lng.flag}</span>
                    <span className="uppercase">{lng.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/acomodacoes"
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-center py-3 rounded-xl uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              {t('nav.bookNow')}
            </Link>

            <a
              href="https://wa.me/5521969493569?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20as%20su%C3%ADtes%20da%20Pousada%20Monte%20Alto."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-center py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Direto: (21) 96949-3569
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
