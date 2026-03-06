import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { referralService } from '@/lib/referral/referral-service';

/**
 * GET: التحقق من صحة كود الإحالة
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return apiError('كود الإحالة مطلوب');
  }

  try {
    const result = await referralService.validateReferralCode(code);

    if (!result.valid) {
      return apiError('كود الإحالة غير صالح');
    }

    return apiResponse({
      valid: true,
      referrer: result.referrer ? {
        name: result.referrer.name,
        username: result.referrer.username,
      } : null,
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    return apiError('حدث خطأ أثناء التحقق من كود الإحالة', 500);
  }
}
