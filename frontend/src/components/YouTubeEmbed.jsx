import React from 'react';
import SocialVideoEmbed from './SocialVideoEmbed';

/**
 * YouTubeEmbed: Wrapper compatível com qualquer vídeo social (YouTube, Instagram, Facebook, X)
 */
export default function YouTubeEmbed({ url, title = "Tour Virtual em Vídeo", isPreview = false }) {
  return <SocialVideoEmbed url={url} title={title} isPreview={isPreview} />;
}
