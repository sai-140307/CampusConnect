import React from 'react';

export const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80';
export const FALLBACK_CLUB_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80';
export const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl = FALLBACK_EVENT_IMAGE) {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
