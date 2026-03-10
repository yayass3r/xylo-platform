import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true,
            bio: true,
            isVerified: true,
          },
        },
        comments: {
          where: { isActive: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    // Increment view count
    await db.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المقال' },
      { status: 500 }
    );
  }
}

// Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const article = await db.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    if (article.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بتعديل هذا المقال' }, { status: 403 });
    }

    const updated = await db.article.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
        publishedAt: body.status === 'PUBLISHED' && !article.publishedAt 
          ? new Date() 
          : article.publishedAt,
      },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المقال' },
      { status: 500 }
    );
  }
}

// Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const article = await db.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    if (article.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بحذف هذا المقال' }, { status: 403 });
    }

    await db.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المقال' },
      { status: 500 }
    );
  }
}
