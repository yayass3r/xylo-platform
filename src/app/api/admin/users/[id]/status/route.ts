import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

// PUT: تغيير حالة مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, role } = body;

    // منع تعديل حالة المسؤول الحالي
    if (id === authResult.user!.id) {
      return apiError('لا يمكنك تعديل حسابك الخاص من هنا');
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }

    if (role) {
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        status: true,
      },
    });

    return apiResponse({ user }, 'تم تحديث المستخدم بنجاح');
  } catch (error) {
    console.error('Update user status error:', error);
    return apiError('حدث خطأ أثناء تحديث المستخدم', 500);
  }
}
