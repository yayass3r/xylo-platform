import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { paymentGatewayManager } from '@/lib/payment/gateway-manager';

/**
 * GET: بوابة دفع واحدة
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const gateway = await paymentGatewayManager.getGatewayWithCredentials(id);

    if (!gateway) {
      return apiError('بوابة الدفع غير موجودة', 404);
    }

    return apiResponse({ gateway });
  } catch (error) {
    console.error('Get gateway error:', error);
    return apiError('فشل في جلب بوابة الدفع', 500);
  }
}

/**
 * PUT: تحديث بوابة دفع
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const gateway = await paymentGatewayManager.updateGateway(id, body);

    return apiResponse({ gateway }, 'تم تحديث بوابة الدفع بنجاح');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في تحديث بوابة الدفع';
    return apiError(message);
  }
}

/**
 * DELETE: حذف بوابة دفع
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    await paymentGatewayManager.deleteGateway(id);

    return apiResponse(null, 'تم حذف بوابة الدفع بنجاح');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في حذف بوابة الدفع';
    return apiError(message);
  }
}

/**
 * PATCH: تغيير حالة بوابة الدفع
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'].includes(status)) {
      return apiError('حالة غير صالحة');
    }

    await paymentGatewayManager.setGatewayStatus(id, status);

    return apiResponse(null, 'تم تغيير حالة بوابة الدفع بنجاح');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في تغيير حالة بوابة الدفع';
    return apiError(message);
  }
}
