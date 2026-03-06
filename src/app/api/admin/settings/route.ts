import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

// GET: إعدادات النظام
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
      };
      return acc;
    }, {} as Record<string, { value: string; description: string | null }>);

    return apiResponse({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    return apiError('حدث خطأ أثناء جلب الإعدادات', 500);
  }
}

// PUT: تحديث الإعدادات
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return apiError('بيانات الإعدادات غير صالحة');
    }

    // تحديث كل إعداد
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return apiResponse(null, 'تم تحديث الإعدادات بنجاح');
  } catch (error) {
    console.error('Update settings error:', error);
    return apiError('حدث خطأ أثناء تحديث الإعدادات', 500);
  }
}
