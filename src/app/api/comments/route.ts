import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get comments for article
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!articleId) {
      return NextResponse.json({ error: 'معرف المقال مطلوب' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Get top-level comments with replies count
    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { 
          articleId, 
          parentId: null,
          isActive: true 
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: { 
              comments: true // replies
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.comment.count({ 
        where: { articleId, parentId: null, isActive: true } 
      }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التعليقات' }, { status: 500 });
  }
}

// Create comment
const createCommentSchema = z.object({
  articleId: z.string(),
  content: z.string().min(1, 'التعليق لا يمكن أن يكون فارغاً').max(1000, 'التعليق طويل جداً'),
  parentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { articleId, content, parentId } = createCommentSchema.parse(body);

    // Check article exists
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    // If reply, check parent comment exists
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return NextResponse.json({ error: 'التعليق الأصلي غير موجود' }, { status: 404 });
      }
    }

    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          articleId,
          authorId: user.id,
          content,
          parentId: parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      });

      // Notify article author (if not commenting on own article)
      if (article.authorId !== user.id) {
        await tx.notification.create({
          data: {
            userId: article.authorId,
            type: 'NEW_COMMENT',
            title: 'تعليق جديد 💬',
            message: `${user.name || user.email} علق على مقالك`,
            data: JSON.stringify({ articleId, commentId: newComment.id }),
          },
        });
      }

      return newComment;
    });

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء التعليق' }, { status: 500 });
  }
}

// Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'معرف التعليق مطلوب' }, { status: 400 });
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'التعليق غير موجود' }, { status: 404 });
    }

    // Only author or admin can delete
    if (comment.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بحذف هذا التعليق' }, { status: 403 });
    }

    // Soft delete
    await db.comment.update({
      where: { id: commentId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف التعليق' }, { status: 500 });
  }
}
