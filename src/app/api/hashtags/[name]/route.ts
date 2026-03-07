import { NextRequest, NextResponse } from 'next/server';
import { getPaginationParams } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

/**
 * GET /api/hashtags/[name]
 * الحصول على مقالات هاشتاق معين
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const hashtagName = decodeURIComponent(name).toLowerCase().replace('#', '');
    const { page, limit, skip } = getPaginationParams(request);

    // البحث عن الهاشتاق
    const hashtag = await prisma.hashtag.findUnique({
      where: { name: hashtagName },
    });

    if (!hashtag) {
      // إذا لم يكن الهاشتاق موجوداً، نبحث عن مقالات تحتوي على الهاشتاق في المحتوى
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { content: { contains: `#${hashtagName}`, mode: 'insensitive' } },
            { tags: { has: hashtagName } },
          ],
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
          _count: {
            select: { gifts: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const totalCount = await prisma.article.count({
        where: {
          status: 'PUBLISHED',
          OR: [
            { content: { contains: `#${hashtagName}`, mode: 'insensitive' } },
            { tags: { has: hashtagName } },
          ],
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          hashtag: {
            id: 'temp',
            name: hashtagName,
            nameAr: null,
            articlesCount: totalCount,
          },
          articles: articles.map((article) => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            coverImage: article.coverImage,
            category: article.category,
            viewsCount: article.viewsCount,
            readTime: article.readTime,
            createdAt: article.createdAt,
            giftsCount: article._count.gifts,
            author: article.author,
          })),
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      });
    }

    // جلب المقالات المرتبطة بالهاشتاق
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        articleHashtags: {
          some: {
            hashtagId: hashtag.id,
          },
        },
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
        _count: {
          select: { gifts: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = await prisma.article.count({
      where: {
        status: 'PUBLISHED',
        articleHashtags: {
          some: {
            hashtagId: hashtag.id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        hashtag: {
          id: hashtag.id,
          name: hashtag.name,
          nameAr: hashtag.nameAr,
          articlesCount: totalCount,
        },
        articles: articles.map((article) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          category: article.category,
          viewsCount: article.viewsCount,
          readTime: article.readTime,
          createdAt: article.createdAt,
          giftsCount: article._count.gifts,
          author: article.author,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get hashtag articles error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب المقالات' },
      { status: 500 },
    );
  }
}
