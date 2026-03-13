import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get likes for article
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

    const [likes, total] = await Promise.all([
      db.articleLike.findMany({
        where: { articleId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.articleLike.count({ where: { articleId } }),
    ]);

    return NextResponse.json({
      likes: likes.map(l => ({ ...l.user, likedAt: l.createdAt })),
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإعجابات' }, { status: 500 });
  }
}

// Like/Unlike article
const likeSchema = z.object({
  articleId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { articleId } = likeSchema.parse(body);

    // Check article exists
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await db.articleLike.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await db.$transaction(async (tx) => {
        await tx.articleLike.delete({
          where: { id: existingLike.id },
        });
        await tx.article.update({
          where: { id: articleId },
          data: { likes: { decrement: 1 } },
        });
      });

      return NextResponse.json({ success: true, action: 'unliked', likes: -1 });
    } else {
      // Like
      await db.$transaction(async (tx) => {
        await tx.articleLike.create({
          data: { articleId, userId: user.id },
        });
        await tx.article.update({
          where: { id: articleId },
          data: { likes: { increment: 1 } },
        });

        // Notify article author (if not liking own article)
        if (article.authorId !== user.id) {
          await tx.notification.create({
            data: {
              userId: article.authorId,
              type: 'ARTICLE_LIKED',
              title: 'إعجاب جديد ❤️',
              message: `${user.name || user.email} أعجب بمقالك`,
              data: JSON.stringify({ articleId }),
            },
          });
        }
      });

      return NextResponse.json({ success: true, action: 'liked', likes: 1 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error('Like error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء العملية' }, { status: 500 });
  }
}

// Check if liked
export async function HEAD(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isLiked: false });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'معرف المقال مطلوب' }, { status: 400 });
    }

    const like = await db.articleLike.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error) {
    console.error('Check like error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
