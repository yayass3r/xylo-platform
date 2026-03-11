import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get hashtags with articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (tag) {
      // Get articles by hashtag
      const skip = (page - 1) * limit;

      const hashtag = await db.hashtag.findUnique({
        where: { name: tag.toLowerCase() },
        include: {
          articles: {
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
            orderBy: { article: { createdAt: 'desc' } },
            skip,
            take: limit,
          },
        },
      });

      if (!hashtag) {
        return NextResponse.json({ error: 'الوسم غير موجود' }, { status: 404 });
      }

      return NextResponse.json({
        hashtag: {
          name: hashtag.name,
          count: hashtag.count,
          articles: hashtag.articles.map(a => a.article),
        },
      });
    } else {
      // Get popular hashtags
      const hashtags = await db.hashtag.findMany({
        orderBy: { count: 'desc' },
        take: limit,
      });

      return NextResponse.json({ hashtags });
    }
  } catch (error) {
    console.error('Get hashtags error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الوسوم' }, { status: 500 });
  }
}
