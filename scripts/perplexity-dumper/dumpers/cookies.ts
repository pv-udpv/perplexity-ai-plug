import type { CookieData } from '../types';

function parseCookie(cookieString: string): CookieData[] {
  return cookieString.split(';').map((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    return {
      name: name.trim(),
      value: valueParts.join('=').trim(),
    };
  }).filter(c => c.name);
}

export async function dumpCookies(): Promise<CookieData[]> {
  try {
    return parseCookie(document.cookie);
  } catch (error) {
    console.error('Failed to dump cookies:', error);
    return [];
  }
}
