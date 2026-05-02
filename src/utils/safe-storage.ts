type CookieOptions = {
  path?: string;
  maxAge?: number;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('localStorage clear failed:', error);
    }
  },

  setCookie: (name: string, value: string, options: CookieOptions = {}): void => {
    if (typeof window === 'undefined' || !name) return;
    try {
      const path = options.path ?? '/';
      const sameSite = options.sameSite ?? 'Lax';
      const secure = options.secure ? '; Secure' : '';
      const maxAge = typeof options.maxAge === 'number' ? `; max-age=${options.maxAge}` : '';
      document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}${maxAge}; SameSite=${sameSite}${secure}`;
    } catch (error) {
      console.warn('cookie set failed:', error);
    }
  },

  clearCookie: (name: string, options: Omit<CookieOptions, 'maxAge'> = {}): void => {
    if (typeof window === 'undefined' || !name) return;
    try {
      const path = options.path ?? '/';
      const sameSite = options.sameSite ?? 'Lax';
      const secure = options.secure ? '; Secure' : '';
      document.cookie = `${name}=; path=${path}; max-age=0; SameSite=${sameSite}${secure}`;
    } catch (error) {
      console.warn('cookie clear failed:', error);
    }
  },

  clearAllCookies: (): void => {
    if (typeof window === 'undefined') return;
    try {
      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        if (!name) return;
        safeStorage.clearCookie(name);
      });
    } catch (error) {
      console.warn('cookie clear all failed:', error);
    }
  },
};
