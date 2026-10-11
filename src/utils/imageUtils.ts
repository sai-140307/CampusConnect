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

const AVATAR_COLORS = ['#3b4cca', '#0e7c7b', '#b45309', '#9d174d', '#4d7c0f', '#6d28d9', '#0369a1'];

/** A generated initials avatar, so every person gets their own instead of a stock photo. */
export function initialsAvatar(name: string): string {
  const clean = (name || 'Student').trim();
  const initials =
    clean
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || 'S';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="${color}"/>` +
    `<text x="32" y="33" dy=".35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="600" fill="#fff">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
