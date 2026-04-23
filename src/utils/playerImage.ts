// ── Player avatar helpers ─────────────────────────────────────
// Ported from frontend/src/utils/playerImage.js

const AVATAR_COLOURS = [
  '#0F4A23', '#1E7A3E', '#C1572E', '#A84620',
  '#1F5580', '#7C3AED', '#B67300', '#0891B2',
];

/**
 * Deterministic colour for a player/user name.
 * Same name always returns the same colour.
 */
export function avatarColour(name: string): string {
  let hash = 0;
  for (const c of name || '') hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}

/**
 * First + Last initials from a name string.
 * "Carlos Alcaraz" → "CA", "Novak" → "N"
 */
export function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Build a slug from a player name for image filename lookup.
 * Strips accents so accented variants resolve.
 */
export function nameSlug(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Is this a mock/internal ID rather than a real data-provider ID?
 * Mock IDs: "p1", "mc-p5", "madrid-p3", etc.
 */
export function isMockId(id: string | null | undefined): boolean {
  return !id || /^(\w+-)?p\d+$/i.test(id);
}

/**
 * Returns an ordered list of headshot URLs to try for a player.
 * PlayerAvatar walks this list: try each URL, on error try the next,
 * then fall back to initials circle.
 *
 * Resolution order:
 * 1. Real player ID  → /players/{id}.jpg  (skipped for mock IDs)
 * 2. Name slug       → /players/{slug}.jpg
 */
export function getPlayerImageUrls(playerId: string, playerName: string): string[] {
  const urls: string[] = [];
  if (playerId && !isMockId(playerId)) {
    urls.push(`https://finalserveivor.com/players/${playerId}.jpg`);
  }
  if (playerName) {
    urls.push(`https://finalserveivor.com/players/${nameSlug(playerName)}.jpg`);
  }
  return urls;
}
