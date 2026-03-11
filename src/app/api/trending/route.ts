import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get trending content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'articles'; // articles, creators, tags
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'week'; // day, week, month

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    if (type === 'articles') {
      // Trending articles based on engagement score
      const articles = await db.$queryRaw<Array<{
        id: string;
        title: string;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        category: string | null;
        views: number;
        likes: number;
        giftCount: number;
        createdAt: Date;
        authorId: string;
        authorName: string | null;
        authorDisplayName: string | null;
        authorAvatar: string | null;
        authorVerified: number;
        score: number;
      }>>`
        SELECT 
          a.id, a.title, a.slug, a.excerpt, a."coverImage", a.category,
          a.views, a.likes, a."giftCount", a."createdAt", a."authorId",
          u.name as "authorName", u."displayName" as "authorDisplayName",
          u.avatar as "authorAvatar", u."isVerified" as "authorVerified",
          (a.views + a.likes * 5 + a."giftCount" * 20) as score
        FROM articles a
        JOIN users u ON a."authorId" = u.id
        WHERE a.status = 'PUBLISHED'
          AND a."publishedAt" >= ${startDate.toISOString()}
        ORDER BY score DESC
        LIMIT ${limit}
      `;

      return NextResponse.json({
        trending: articles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          coverImage: a.coverImage,
          category: a.category,
          views: a.views,
          likes: a.likes,
          giftCount: a.giftCount,
          createdAt: a.createdAt,
          score: a.score,
          author: {
            id: a.authorId,
            name: a.authorName,
            displayName: a.authorDisplayName,
            avatar: a.authorAvatar,
            isVerified: !!a.authorVerified,
          },
        })),
      });
    } else if (type === 'creators') {
      // Trending creators based on engagement received
      const creators = await db.$queryRaw<Array<{
        id: string;
        name: string | null;
        displayName: string | null;
        avatar: string | null;
        isVerified: number;
        role: string;
        articleCount: number;
        totalViews: number;
        totalLikes: number;
        totalGifts: number;
        score: number;
      }>>`
        SELECT 
          u.id, u.name, u."displayName", u.avatar, u."isVerified", u.role,
          COUNT(a.id) as "articleCount",
          COALESCE(SUM(a.views), 0) as "totalViews",
          COALESCE(SUM(a.likes), 0) as "totalLikes",
          COALESCE(SUM(a."giftCount"), 0) as "totalGifts",
          (COALESCE(SUM(a.views), 0) + COALESCE(SUM(a.likes), 0) * 5 + COALESCE(SUM(a."giftCount"), 0) * 20) as score
        FROM users u
        LEFT JOIN articles a ON u.id = a."authorId" AND a.status = 'PUBLISHED' AND a."publishedAt" >= ${startDate.toISOString()}
        WHERE u."isActive" = 1
        GROUP BY u.id
        HAVING COUNT(a.id) > 0
        ORDER BY score DESC
        LIMIT ${limit}
      `;

      return NextResponse.json({
        trending: creators.map(c => ({
          id: c.id,
          name: c.name,
          displayName: c.displayName,
          avatar: c.avatar,
          isVerified: !!c.isVerified,
          role: c.role,
          stats: {
            articleCount: c.articleCount,
            totalViews: c.totalViews,
            totalLikes: c.totalLikes,
            totalGifts: c.totalGifts,
          },
          score: c.score,
        })),
      });
    } else if (type === 'tags') {
      // Trending hashtags
      const tags = await db.hashtag.findMany({
        orderBy: { count: 'desc' },
        take: limit,
      });

      return NextResponse.json({ trending: tags });
    }

    return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('Get trending error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المحتوى الرائج' }, { status: 500 });
  }
}
