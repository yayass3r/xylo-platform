import { NextRequest, NextResponse } from 'next/server';
import { locales, isValidLocale, defaultLocale } from '@/i18n/config';

// استيراد ملفات الترجمة بشكل ثابت
import arMessages from '@/../../messages/ar.json';
import enMessages from '@/../../messages/en.json';
import trMessages from '@/../../messages/tr.json';

const translations: Record<string, Record<string, unknown>> = {
  ar: arMessages,
  en: enMessages,
  tr: trMessages,
};

/**
 * GET: الحصول على ترجمات لغة معينة
 * Get translations for a specific locale
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params;

    // التحقق من صحة اللغة
    if (!isValidLocale(locale)) {
      return NextResponse.json(
        { success: false, message: 'Invalid locale' },
        { status: 400 }
      );
    }

    // تحميل الترجمة من الذاكرة
    const messages = translations[locale] || translations[defaultLocale];

    return NextResponse.json({
      success: true,
      locale,
      messages,
    });
  } catch (error) {
    console.error('Translation load error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load translations' },
      { status: 500 }
    );
  }
}
