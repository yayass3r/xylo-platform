import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { coinsService } from '@/lib/financial/coins-service';

/**
 * GET: الحصول على الحزم المتاحة
 */
export async function GET() {
  try {
    const packages = await coinsService.getAvailablePackages();
    return apiResponse({ packages });
  } catch (error) {
    console.error('Get packages error:', error);
    return apiError('فشل في جلب الحزم', 500);
  }
}

/**
 * POST: شراء عملات
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { packageId, paymentMethod, paymentReference, gatewayId, gatewayTransactionId } = body;

    if (!packageId || !paymentMethod || !paymentReference) {
      return apiError('جميع البيانات مطلوبة');
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await coinsService.purchaseCoins(authResult.user!.id, packageId, {
      paymentMethod,
      paymentReference,
      gatewayId,
      gatewayTransactionId,
      ipAddress: ip || undefined,
      userAgent,
    });

    if (!result.success) {
      return apiError(result.message);
    }

    return apiResponse(result, result.message);
  } catch (error) {
    console.error('Purchase coins error:', error);
    return apiError('حدث خطأ أثناء عملية الشراء', 500);
  }
}
