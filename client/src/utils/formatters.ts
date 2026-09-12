export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNetworkRate(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  if (bytesPerSec < 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
}

export function redactText(text: string, isPrivacy: boolean): string {
  if (!isPrivacy || !text) return text;
  // Redact IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(text)) {
    const parts = text.split('.');
    return `${parts[0]}.${parts[1]}.•••.•••`;
  }
  // Redact domain
  if (text.includes('.')) {
    const parts = text.split('.');
    return `••••••.${parts.slice(-1)[0]}`;
  }
  return '••••••';
}

export function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(' ');
}

export function getStatusColor(percent: number): {
  bar: string;
  badge: string;
  text: string;
} {
  if (percent >= 90) {
    return {
      bar: 'bg-rose-500',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      text: 'text-rose-400',
    };
  }
  if (percent >= 75) {
    return {
      bar: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      text: 'text-amber-400',
    };
  }
  return {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
  };
}

export function getTempColor(temp: number): {
  color: string;
  label: string;
} {
  if (temp > 75) return { color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', label: 'HOT' };
  if (temp > 60) return { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', label: 'WARM' };
  return { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', label: 'COOL' };
}
