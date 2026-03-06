import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // محاولة الحصول على اللغة من عدة مصادر
  let locale: Locale | undefined;

  // 1. من الكوكيز
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale');
    if (localeCookie && locales.includes(localeCookie.value as Locale)) {
      locale = localeCookie.value as Locale;
    }
  } catch {
    // Cookies not available
  }

  // 2. من header Accept-Language
  if (!locale) {
    try {
      const headersList = await headers();
      const acceptLanguage = headersList.get('accept-language');
      if (acceptLanguage) {
        const preferredLocale = acceptLanguage
          .split(',')
          .map((lang) => lang.split(';')[0].trim().substring(0, 2))
          .find((lang) => locales.includes(lang as Locale));

        if (preferredLocale) {
          locale = preferredLocale as Locale;
        }
      }
    } catch {
      // Headers not available
    }
  }

  // 3. الافتراضي
  if (!locale) {
    locale = 'ar';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
