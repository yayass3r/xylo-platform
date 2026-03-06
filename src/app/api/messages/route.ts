import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { privateMessaging } from '@/lib/messages/encrypted-messaging';

/**
 * GET: قائمة محادثات المستخدم
 */
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const conversations = await privateMessaging.getUserConversations(authResult.user!.id);
    return apiResponse({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return apiError('فشل في جلب المحادثات', 500);
  }
}

/**
 * POST: إنشاء محادثة جديدة
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { participants, type, name } = body;

    const conversation = await privateMessaging.createConversation(
      participants || [authResult.user!.id, body.receiverId],
      type || 'DIRECT',
      name
    );

    return apiResponse({ conversation }, 'تم إنشاء المحادثة بنجاح', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل في إنشاء المحادثة';
    return apiError(message);
  }
}
