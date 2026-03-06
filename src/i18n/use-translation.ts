'use client';

import { useState, useEffect, useCallback, createContext, useContext, createElement, type ReactNode } from 'react';
import type { Locale } from './config';
import { locales, defaultLocale, isRtl, getDirection, languageList } from './config';

// Cache for loaded messages
const messagesCache: Record<string, Record<string, unknown>> = {};

// Simple context for basic locale info
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: 'rtl' | 'ltr';
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  direction: 'rtl',
  isRtl: true,
});

export const useI18nContext = () => useContext(I18nContext);

/**
 * Hook لاستخدام نظام الترجمة
 * Hook for using the translation system
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  // تحميل رسائل اللغة
  const loadMessages = useCallback(async (targetLocale: Locale) => {
    setIsLoading(true);
    try {
      if (messagesCache[targetLocale]) {
        setMessages(messagesCache[targetLocale]);
      } else {
        // Load from static import
        const localMessages = (await import(`@/../../messages/${targetLocale}.json`)).default;
        messagesCache[targetLocale] = localMessages as Record<string, unknown>;
        setMessages(localMessages as Record<string, unknown>);
      }
    } catch {
      // Load default locale messages
      const fallbackMessages = (await import(`@/../../messages/${defaultLocale}.json`)).default;
      setMessages(fallbackMessages as Record<string, unknown>);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحميل الرسائل عند التهيئة
  useEffect(() => {
    const savedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem('locale') as Locale | null 
      : null;
    const initialLocale = savedLocale && locales.includes(savedLocale) ? savedLocale : defaultLocale;
    
    setLocaleState(initialLocale);
    loadMessages(initialLocale);
  }, [loadMessages]);

  // تغيير اللغة
  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    document.documentElement.lang = newLocale;
    document.documentElement.dir = getDirection(newLocale);
    await loadMessages(newLocale);
  }, [loadMessages]);

  // دالة الترجمة
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = messages;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // Return key if not found
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      // Replace parameters
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
          value
        );
      }

      return value;
    },
    [messages]
  );

  return {
    t,
    locale,
    setLocale,
    isRtl: isRtl(locale),
    direction: getDirection(locale),
    isLoading,
    languages: languageList,
  };
}

/**
 * Hook للحصول على اللغة الحالية فقط
 * Hook for getting current locale only
 */
export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    // Initialize from localStorage synchronously
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      if (savedLocale && locales.includes(savedLocale)) {
        return savedLocale;
      }
    }
    return defaultLocale;
  });

  return {
    locale,
    isRtl: isRtl(locale),
    direction: getDirection(locale),
  };
}

/**
 * Provider لتغليف التطبيق
 * Provider for wrapping the application
 */
export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(getDirection(initialLocale));

  useEffect(() => {
    // Update HTML attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
  }, [locale, direction]);

  const changeLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setDirection(getDirection(newLocale));
  };

  const contextValue: I18nContextType = {
    locale,
    setLocale: changeLocale,
    direction,
    isRtl: isRtl(locale),
  };

  return createElement(
    I18nContext.Provider,
    { value: contextValue },
    children
  );
}
