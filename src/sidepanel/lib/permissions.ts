import { originPatternFromUrl } from './format';

// WebLoop never requests broad host access up front. It asks for one site at a
// time, only when the user records or runs against that site. This module is
// the single gateway for those just-in-time requests and for the Permissions
// panel that lets users review and revoke them.

export class PermissionError extends Error {}

export async function ensurePagePermission(tab: chrome.tabs.Tab | null): Promise<void> {
  if (!tab?.url || !/^https?:/.test(tab.url)) {
    throw new PermissionError('请先打开一个 http/https 网页（老系统/内网页面）。');
  }
  const origin = originPatternFromUrl(tab.url);
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (!has) {
    const ok = await chrome.permissions.request({ origins: [origin] });
    if (!ok) {
      throw new PermissionError('未授权当前站点，无法录制或执行。授权只对该站点生效，可随时撤销。');
    }
  }
}

export async function listGrantedOrigins(): Promise<string[]> {
  try {
    const all = await chrome.permissions.getAll();
    return (all.origins || []).filter((o) => o.startsWith('http')).sort();
  } catch {
    return [];
  }
}

export async function requestOrigin(origin: string): Promise<boolean> {
  return chrome.permissions.request({ origins: [origin] });
}

export async function removeOrigin(origin: string): Promise<boolean> {
  return chrome.permissions.remove({ origins: [origin] });
}

export function prettyOrigin(origin: string): string {
  return origin.replace(/\/\*$/, '');
}
