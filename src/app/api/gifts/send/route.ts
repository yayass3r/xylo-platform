import { NextRequest } from 'next/server';
import { withActiveUser, apiResponse, apiError } from '@/lib/api-utils';
import { sendGift } from '@/lib/gifts';

// POST: إرسال هدية
export async function POST(request: NextRequest) {
  try {
    const authResult = await withActiveUser(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { giftId, receiverId, articleId, message } = body;

    if (!giftId || !receiverId) {
      return apiError('يرجى تحديد الهدية والمستلم');
    }

    const result = await sendGift(
      authResult.user!.id,
      receiverId,
      giftId,
      articleId,
      message
    );

    return apiResponse(result, 'تم إرسال الهدية بنجاح');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال الهدية';
    return apiError(message);
  }
}
