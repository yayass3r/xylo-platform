import { NextRequest } from 'next/server';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { updateArticleSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await db.article.findUnique({
      where: { slug },
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
          select: { gifts: true },
        },
      },
    });

    if (!article) {
      return notFoundResponse('المقال غير موجود');
    }

    // Increment view count
    await db.article.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } },
    });

    return successResponse(article);
  } catch (error) {
    console.error('Get article error:', error);
    return errorResponse('حدث خطأ أثناء جلب المقال');
  }
}

// PUT - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await params;
    const article = await db.article.findUnique({ where: { slug } });

    if (!article) {
      return notFoundResponse('المقال غير موجود');
    }

    if (article.authorId !== user.id && user.role !== 'ADMIN') {
      return forbiddenResponse('لا يمكنك تعديل هذا المقال');
    }

    const body = await request.json();
    const validation = updateArticleSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { title, content, excerpt, coverImage, category, isPaid } = validation.data;

    const updateData: Record<string, unknown> = {};
    
    if (title) updateData.title = title;
    if (content) {
      updateData.content = content;
      updateData.readTime = Math.ceil(content.trim().split(/\s+/).length / 200);
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (category) updateData.category = category;
    if (isPaid !== undefined) updateData.isPaid = isPaid;

    const updatedArticle = await db.article.update({
      where: { id: article.id },
      data: updateData,
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

    return successResponse(updatedArticle, 'تم تحديث المقال بنجاح');
  } catch (error) {
    console.error('Update article error:', error);
    return errorResponse('حدث خطأ أثناء تحديث المقال');
  }
}

// DELETE - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await params;
    const article = await db.article.findUnique({ where: { slug } });

    if (!article) {
      return notFoundResponse('المقال غير موجود');
    }

    if (article.authorId !== user.id && user.role !== 'ADMIN') {
      return forbiddenResponse('لا يمكنك حذف هذا المقال');
    }

    await db.article.delete({ where: { id: article.id } });

    return successResponse(null, 'تم حذف المقال بنجاح');
  } catch (error) {
    console.error('Delete article error:', error);
    return errorResponse('حدث خطأ أثناء حذف المقال');
  }
}
