/**
 * إعدادات نظام تعدد اللغات لمنصة زايلو
 * i18n Configuration for Xylo Platform
 */

export const locales = ['ar', 'en', 'tr', 'fr', 'ur'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const rtlLocales: Locale[] = ['ar', 'ur'];

export const localeNames: Record<Locale, { native: string; english: string }> = {
  ar: { native: 'العربية', english: 'Arabic' },
  en: { native: 'English', english: 'English' },
  tr: { native: 'Türkçe', english: 'Turkish' },
  fr: { native: 'Français', english: 'French' },
  ur: { native: 'اردو', english: 'Urdu' },
};

export const localeFlags: Record<Locale, string> = {
  ar: '🇸🇦',
  en: '🇺🇸',
  tr: '🇹🇷',
  fr: '🇫🇷',
  ur: '🇵🇰',
};

/**
 * التحقق مما إذا كانت اللغة من اليمين لليسار
 * Check if a locale is right-to-left
 */
export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

/**
 * الحصول على اتجاه النص
 * Get text direction
 */
export function getDirection(locale: string): 'rtl' | 'ltr' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

/**
 * التحقق من صحة اللغة
 * Validate locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * الحصول على اللغة أو الافتراضية
 * Get locale or default
 */
export function getLocaleOrDefault(locale: string | undefined): Locale {
  if (locale && isValidLocale(locale)) {
    return locale;
  }
  return defaultLocale;
}

/**
 * قائمة اللغات للعرض في القائمة
 * List of languages for display in menu
 */
export const languageList = locales.map((locale) => ({
  code: locale,
  name: localeNames[locale].native,
  englishName: localeNames[locale].english,
  flag: localeFlags[locale],
  direction: getDirection(locale),
}));

// Configuration object for convenience
const i18nConfig = {
  locales,
  defaultLocale,
  rtlLocales,
  localeNames,
  localeFlags,
  isRtl,
  getDirection,
  isValidLocale,
  getLocaleOrDefault,
  languageList,
};

export default i18nConfig;
