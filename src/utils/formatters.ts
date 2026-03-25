/**
 * Format a date string to a human-readable relative time.
 * e.g. "in 2 hours", "3 days ago"
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  let label: string;
  if (minutes < 1) label = 'just now';
  else if (minutes < 60) label = `${minutes}m`;
  else if (hours < 24) label = `${hours}h`;
  else label = `${days}d`;

  if (label === 'just now') return label;
  return isFuture ? `in ${label}` : `${label} ago`;
}

/**
 * Format a date to "Mon 22 Mar, 2:00 PM" style.
 */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncate a name to maxLen characters with ellipsis.
 */
export function truncateName(name: string, maxLen: number = 18): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1).trim() + '\u2026';
}

/**
 * Format a countdown from milliseconds to "Xh Ym" or "Xm Ys".
 */
export function formatCountdown(ms: number): { hours: number; minutes: number; seconds: number; display: string } {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0, display: 'Locked' };

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let display: string;
  if (hours > 0) {
    display = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    display = `${minutes}m ${seconds}s`;
  } else {
    display = `${seconds}s`;
  }

  return { hours, minutes, seconds, display };
}
