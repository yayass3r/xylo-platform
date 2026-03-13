import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user bookmarks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where: { userId: user.id },
        include: {
          article: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.bookmark.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      bookmarks: bookmarks.map(b => ({
        ...b.article,
        bookmarkedAt: b.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المحفوظات' }, { status: 500 });
  }
}

// Bookmark/Unbookmark article
const bookmarkSchema = z.object({
  articleId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { articleId } = bookmarkSchema.parse(body);

    // Check article exists
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true, status: true },
    });

    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await db.bookmark.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id,
        },
      },
    });

    if (existingBookmark) {
      // Unbookmark
      await db.bookmark.delete({
        where: { id: existingBookmark.id },
      });

      return NextResponse.json({ success: true, action: 'unbookmarked' });
    } else {
      // Bookmark
      await db.bookmark.create({
        data: { articleId, userId: user.id },
      });

      return NextResponse.json({ success: true, action: 'bookmarked' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء العملية' }, { status: 500 });
  }
}

// Check if bookmarked
export async function HEAD(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'معرف المقال مطلوب' }, { status: 400 });
    }

    const bookmark = await db.bookmark.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Check bookmark error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
