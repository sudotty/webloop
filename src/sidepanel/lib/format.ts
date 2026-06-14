import type { RunStatus, Schedule } from '../../types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '当前页面';
  }
}

export function originPatternFromUrl(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.host}/*`;
}

export function shortUrl(url: string | undefined): string {
  if (!url) return '—';
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return url;
  }
}

export function formatTime(v: string | number | undefined): string {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(v);
  }
}

export function scheduleLabel(s: Schedule | undefined = {} as Schedule): string {
  if (s.type === 'daily') return `每天 ${s.time || '08:30'}`;
  if (s.type === 'workdays') return `工作日 ${s.time || '08:30'}`;
  if (s.type === 'interval') return `每 ${s.intervalMinutes || 60} 分钟`;
  return '手动执行';
}

export const BADGE_LABELS: Record<RunStatus, { cls: string; text: string }> = {
  success: { cls: 'success', text: '已完成' },
  failed: { cls: 'failed', text: '失败' },
  running: { cls: 'running', text: '运行中' },
  blocked: { cls: 'blocked', text: '需人工' },
  idle: { cls: 'idle', text: '待执行' },
  paused: { cls: 'paused', text: '已暂停' },
  enabled: { cls: 'success', text: '启用' }
};

export function fileName(path: string | undefined): string {
  if (!path) return '';
  return path.split(/[\\/]/).pop() || '';
}
