import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { paymentGatewayManager } from '@/lib/payment/gateway-manager';

/**
 * GET: قائمة بوابات الدفع
 */
export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const gateways = await paymentGatewayManager.listGateways(true);
    return apiResponse({ gateways });
  } catch (error) {
    console.error('Get gateways error:', error);
    return apiError('فشل في جلب بوابات الدفع', 500);
  }
}

/**
 * POST: إنشاء بوابة دفع جديدة
 */
export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const gateway = await paymentGatewayManager.createGateway(body);
    return apiResponse({ gateway }, 'تم إنشاء بوابة الدفع بنجاح', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في إنشاء بوابة الدفع';
    return apiError(message);
  }
}
