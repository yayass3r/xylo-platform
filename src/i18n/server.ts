import 'server-only';
import type { Locale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';

// Cache for loaded messages
const messagesCache = new Map<Locale, Promise<Record<string, unknown>>>();

/**
 * تحميل رسائل اللغة
 * Load locale messages
 */
async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (messagesCache.has(locale)) {
    return messagesCache.get(locale)!;
  }

  const messagesPromise = import(`@/../../messages/${locale}.json`).then((mod) => mod.default);
  messagesCache.set(locale, messagesPromise);

  return messagesPromise;
}

/**
 * الحصول على رسائل اللغة
 * Get locale messages
 */
export async function getMessages(locale: string): Promise<Record<string, unknown>> {
  return loadMessages(locale as Locale);
}

/**
 * الحصول على الترجمة
 * Get translation
 */
export async function getTranslation(
  locale: string,
  key: string,
  params?: Record<string, string | number>
): Promise<string> {
  const messages = await getMessages(locale);
  const keys = key.split('.');
  let value: unknown = messages;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) =>
        str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
      value
    );
  }

  return value;
}

/**
 * إنشاء دالة الترجمة للخادم
 * Create server-side translation function
 */
export async function createTranslator(locale: string) {
  const messages = await getMessages(locale);

  return {
    t: (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = messages;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
          value
        );
      }

      return value;
    },
    locale,
    messages,
  };
}

/**
 * الحصول على لغة الطلب
 * Get request locale
 */
export function getRequestLocale(request: Request): Locale {
  // 1. Check URL path
  const url = new URL(request.url);
  const pathLocale = url.pathname.split('/')[1];
  if (pathLocale && ['ar', 'en', 'tr', 'fr', 'ur'].includes(pathLocale)) {
    return pathLocale as Locale;
  }

  // 2. Check cookie
  const cookieLocale = request.headers.get('cookie')?.match(/locale=([^;]+)/)?.[1];
  if (cookieLocale && ['ar', 'en', 'tr', 'fr', 'ur'].includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2))
      .find((lang) => ['ar', 'en', 'tr', 'fr', 'ur'].includes(lang));

    if (preferredLocale) {
      return preferredLocale as Locale;
    }
  }

  return defaultLocale;
}

export { defaultLocale };
