import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Waves, MapPin, Phone, Mail, Heart, Shield, Clock, Award
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from './SocialIcons';
import Logo from './Logo';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link to="/" className="block">
              <Logo variant="light" size="md" />
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed pt-1">
              {t('footer.desc')}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/pousadamontealtooficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com/pousadamontealtooficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-white font-semibold text-base border-b border-stone-800 pb-2">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/acomodacoes" className="hover:text-amber-400 transition-colors">
                  {t('nav.accommodations')}
                </Link>
              </li>
              <li>
                <Link to="/sobre-localizacao" className="hover:text-amber-400 transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-amber-400 transition-colors">
                  {t('nav.blog')}
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:text-amber-400 transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Location */}
          <div className="space-y-4">
            <h4 className="font-serif text-white font-semibold text-base border-b border-stone-800 pb-2">
              {t('footer.contactInfo')}
            </h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Travessa Américo Reis, Monte Alto, Arraial do Cabo - RJ, CEP 28930-000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="tel:+5521969493569" className="hover:text-white transition-colors">
                  (21) 96949-3569 / (24) 99335-0954
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:contato@pousadamontealto.com.br" className="hover:text-white transition-colors">
                  contato@pousadamontealto.com.br
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-amber-400/80">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Check-in: 14:00 | Check-out: 12:00</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Distinctions */}
          <div className="space-y-4">
            <h4 className="font-serif text-white font-semibold text-base border-b border-stone-800 pb-2">
              Diferenciais
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-center gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pé na areia na praia mais calma de Arraial</span>
              </div>
              <div className="flex items-center gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Aceitamos animais de estimação 🐾</span>
              </div>
              <div className="flex items-center gap-2 bg-stone-800/60 p-2.5 rounded-lg border border-stone-700/50">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reserva direta garantida com melhor tarifa</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Pousada Monte Alto. {t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <span>Desenvolvido com carinho para Arraial do Cabo</span>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-amber-400 text-stone-400 transition-colors">
              {t('footer.adminLink')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
