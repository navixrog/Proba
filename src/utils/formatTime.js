export function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('hr-HR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'short',
  });
}
