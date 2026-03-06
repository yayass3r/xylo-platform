import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';

// GET: مقال واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // البحث بـ ID أو slug
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        gifts: {
          include: {
            gift: true,
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            gifts: true,
          },
        },
      },
    });

    if (!article) {
      return apiError('المقال غير موجود', 404);
    }

    // زيادة عدد المشاهدات
    await prisma.article.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } },
    });

    return apiResponse({ article });
  } catch (error) {
    console.error('Get article error:', error);
    return apiError('حدث خطأ أثناء جلب المقال', 500);
  }
}

// PUT: تحديث مقال
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, excerpt, coverImage, category, tags, isPaid } = body;

    // التحقق من ملكية المقال
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return apiError('المقال غير موجود', 404);
    }

    if (existingArticle.authorId !== authResult.user!.id && authResult.user!.role !== 'ADMIN') {
      return apiError('غير مصرح لك بتعديل هذا المقال', 403);
    }

    // حساب وقت القراءة
    let readTime = existingArticle.readTime;
    if (content) {
      const wordCount = content.split(/\s+/).length;
      readTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: title || existingArticle.title,
        content: content || existingArticle.content,
        excerpt: excerpt || content?.substring(0, 200) || existingArticle.excerpt,
        coverImage: coverImage !== undefined ? coverImage : existingArticle.coverImage,
        category: category !== undefined ? category : existingArticle.category,
        tags: tags || existingArticle.tags,
        isPaid: isPaid !== undefined ? isPaid : existingArticle.isPaid,
        readTime,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return apiResponse({ article }, 'تم تحديث المقال بنجاح');
  } catch (error) {
    console.error('Update article error:', error);
    return apiError('حدث خطأ أثناء تحديث المقال', 500);
  }
}

// DELETE: حذف مقال
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAuth(request);
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
      return apiError('غير مصرح لك بحذف هذا المقال', 403);
    }

    await prisma.article.delete({
      where: { id },
    });

    return apiResponse(null, 'تم حذف المقال بنجاح');
  } catch (error) {
    console.error('Delete article error:', error);
    return apiError('حدث خطأ أثناء حذف المقال', 500);
  }
}
