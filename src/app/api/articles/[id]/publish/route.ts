import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withWriterAuth, apiResponse, apiError } from '@/lib/api-utils';

// POST: نشر مقال
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withWriterAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { id } = await params;

    // التحقق من ملكية المقال
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return apiError('المقال غير موجود', 404);
    }

    if (article.authorId !== authResult.user!.id && authResult.user!.role !== 'ADMIN') {
      return apiError('غير مصرح لك بنشر هذا المقال', 403);
    }

    // تحديث حالة المقال
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        status: 'PENDING', // يحتاج موافقة الإدارة أو PUBLISHED مباشرة
        publishedAt: new Date(),
      },
    });

    return apiResponse({ article: updatedArticle }, 'تم إرسال المقال للمراجعة');
  } catch (error) {
    console.error('Publish article error:', error);
    return apiError('حدث خطأ أثناء نشر المقال', 500);
  }
}
