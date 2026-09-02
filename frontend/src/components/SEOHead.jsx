import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function SEOHead({
  title,
  description,
  image = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  url = 'https://fabioarieira.com/montealto',
  type = 'website',
  schemaJson = null
}) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'pt').substring(0, 2);

  const fullTitle = title 
    ? `${title} | Pousada Monte Alto - Arraial do Cabo` 
    : 'Pousada Monte Alto | Pé na Areia em Arraial do Cabo - RJ';

  const defaultDescription = 'Pousada Monte Alto em Arraial do Cabo - RJ. Suítes aconchegantes e Lofts pé na areia, pet friendly 🐾, em frente à praia de Monte Alto e a 3 min do pôr do sol na Lagoa de Araruama.';
  const metaDescription = description || defaultDescription;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMeta = (attr, key, val) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', metaDescription);
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Open Graph Tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', metaDescription);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', window.location.href);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Pousada Monte Alto');
    setMeta('property', 'og:locale', lang === 'en' ? 'en_US' : lang === 'es' ? 'es_ES' : 'pt_BR');

    // 4. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', metaDescription);
    setMeta('name', 'twitter:image', image);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href.split('?')[0]);

    // 6. Schema.org JSON-LD structured data
    let scriptTag = document.getElementById('schema-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'schema-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      "name": "Pousada Monte Alto",
      "description": metaDescription,
      "url": "https://fabioarieira.com/montealto",
      "image": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
      ],
      "telephone": "+55-21-96949-3569",
      "email": "contato@pousadamontealto.com.br",
      "priceRange": "$$",
      "petsAllowed": true,
      "checkinTime": "14:00",
      "checkoutTime": "12:00",
      "currenciesAccepted": "BRL",
      "paymentAccepted": "Cash, Credit Card, PIX",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Travessa Américo Reis",
        "addressLocality": "Arraial do Cabo",
        "addressRegion": "RJ",
        "postalCode": "28930-000",
        "addressCountry": "BR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -22.9288,
        "longitude": -42.1481
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "128",
        "bestRating": "5"
      },
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Wi-Fi Gratuito", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Pé na Areia", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Pet Friendly", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Ar Condicionado", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Estacionamento", "value": true }
      ]
    };

    scriptTag.text = JSON.stringify(schemaJson || defaultSchema);

  }, [fullTitle, metaDescription, image, type, schemaJson, lang]);

  return null;
}
