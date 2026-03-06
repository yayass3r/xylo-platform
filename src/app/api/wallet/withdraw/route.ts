import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { requestWithdrawal } from '@/lib/wallet';

// POST: طلب سحب أرباح
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = authResult.user!;

    // التحقق من التحقق KYC
    if (!user.isKycVerified) {
      return apiError('يجب التحقق من هويتك أولاً لسحب الأرباح');
    }

    const body = await request.json();
    const { amount, bankName, bankAccount, accountHolderName } = body;

    if (!amount || !bankName || !bankAccount || !accountHolderName) {
      return apiError('جميع البيانات مطلوبة');
    }

    const result = await requestWithdrawal(user.id, amount, {
      bankName,
      bankAccount,
      accountHolderName,
    });

    return apiResponse({ withdrawal: result }, 'تم تقديم طلب السحب بنجاح');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء طلب السحب';
    return apiError(message);
  }
}
