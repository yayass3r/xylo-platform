import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, getPaginationParams } from '@/lib/api-utils';
import { privateMessaging } from '@/lib/messages/encrypted-messaging';

/**
 * GET: رسائل محادثة معينة
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { conversationId } = await params;
    const { page, limit } = getPaginationParams(request);

    const { messages, hasMore } = await privateMessaging.getConversationMessages(
      conversationId,
      authResult.user!.id,
      page,
      limit
    );

    return apiResponse({ messages, hasMore, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في جلب الرسائل';
    return apiError(message);
  }
}

/**
 * POST: إرسال رسالة جديدة
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { content, messageType, attachments, replyToId } = body;

    if (!content) {
      return apiError('محتوى الرسالة مطلوب');
    }

    // الحصول على معرف المستلم من المحادثة
    const conversation = await privateMessaging.getConversation(conversationId, authResult.user!.id);
    if (!conversation) {
      return apiError('المحادثة غير موجودة', 404);
    }

    const receiverId = conversation.participants.find(p => p.userId !== authResult.user!.id)?.userId;
    if (!receiverId) {
      return apiError('المستلم غير موجود');
    }

    const message = await privateMessaging.sendMessage(authResult.user!.id, {
      receiverId,
      content,
      messageType: messageType || 'text',
      attachments,
      replyToId,
    });

    return apiResponse({ message }, 'تم إرسال الرسالة بنجاح', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في إرسال الرسالة';
    return apiError(message);
  }
}

/**
 * PATCH: تحديث حالة الرسائل
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const { conversationId } = await params;
    await privateMessaging.markMessagesAsRead(conversationId, authResult.user!.id);

    return apiResponse(null, 'تم تحديث حالة الرسائل');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في تحديث حالة الرسائل';
    return apiError(message);
  }
}
