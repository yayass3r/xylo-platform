import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getPaginationParams } from '@/lib/api-utils';

/**
 * GET /api/articles/[id]/comments
 * جلب تعليقات المقال
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const { page, limit, skip } = getPaginationParams(request);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          articleId,
          isDeleted: false,
          parentId: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            take: 5,
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          _count: { select: { likes: true, replies: true } },
        },
      }),
      prisma.comment.count({
        where: {
          articleId,
          isDeleted: false,
          parentId: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        content: c.content,
        isEdited: c.isEdited,
        likesCount: c.likesCount,
        createdAt: c.createdAt,
        user: c.user,
        replies: c.replies.map((r) => ({
          id: r.id,
          content: r.content,
          isEdited: r.isEdited,
          likesCount: r.likesCount,
          createdAt: r.createdAt,
          user: r.user,
        })),
        repliesCount: c._count.replies,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب التعليقات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[id]/comments
 * إضافة تعليق جديد
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 });
    }

    const { id: articleId } = await params;
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'محتوى التعليق قصير جداً' },
        { status: 400 }
      );
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, message: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    // إنشاء التعليق
    const comment = await prisma.comment.create({
      data: {
        articleId,
        userId: payload.userId,
        parentId: parentId || null,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة التعليق',
      data: {
        id: comment.id,
        content: comment.content,
        isEdited: comment.isEdited,
        likesCount: comment.likesCount,
        createdAt: comment.createdAt,
        user: comment.user,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة التعليق' },
      { status: 500 }
    );
  }
}
