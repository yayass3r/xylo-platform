import { NextRequest, NextResponse } from 'next/server';
import { isValidLocale, defaultLocale } from '@/i18n/config';

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

    // Return empty translations for now
    // The translation files can be loaded client-side if needed
    return NextResponse.json({
      success: true,
      locale,
      messages: {},
    });
  } catch (error) {
    console.error('Translation load error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load translations' },
      { status: 500 }
    );
  }
}
