import { NextRequest, NextResponse } from 'next/server';
import { getPaginationParams } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

/**
 * GET /api/search
 * البحث في المقالات والمستخدمين والهاشتاقات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, articles, users, hashtags
    const { page, limit, skip } = getPaginationParams(request);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          articles: [],
          users: [],
          hashtags: [],
        },
        message: 'يرجى إدخال كلمة بحث أطول',
      });
    }

    const results: any = {};

    // البحث في المقالات
    if (type === 'all' || type === 'articles') {
      const articlesCount = await prisma.article.count({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
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
        },
        skip: type === 'articles' ? skip : 0,
        take: type === 'articles' ? limit : 5,
        orderBy: { createdAt: 'desc' },
      });

      results.articles = articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        category: article.category,
        viewsCount: article.viewsCount,
        readTime: article.readTime,
        createdAt: article.createdAt,
        author: article.author,
      }));

      if (type === 'articles') {
        results.pagination = {
          page,
          limit,
          total: articlesCount,
          totalPages: Math.ceil(articlesCount / limit),
        };
      }
    }

    // البحث في المستخدمين
    if (type === 'all' || type === 'users') {
      const usersCount = await prisma.user.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          role: true,
          _count: {
            select: {
              articles: { where: { status: 'PUBLISHED' } },
              followers: true,
            },
          },
        },
        skip: type === 'users' ? skip : 0,
        take: type === 'users' ? limit : 5,
        orderBy: { createdAt: 'desc' },
      });

      results.users = users.map((user: any) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        articlesCount: user._count.articles,
        followersCount: user._count.followers,
      }));

      if (type === 'users') {
        results.pagination = {
          page,
          limit,
          total: usersCount,
          totalPages: Math.ceil(usersCount / limit),
        };
      }
    }

    // البحث في الهاشتاقات
    if (type === 'all' || type === 'hashtags') {
      const hashtagsCount = await prisma.hashtag.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nameAr: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      const hashtags = await prisma.hashtag.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nameAr: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip: type === 'hashtags' ? skip : 0,
        take: type === 'hashtags' ? limit : 5,
        orderBy: { articlesCount: 'desc' },
      });

      results.hashtags = hashtags.map((hashtag: any) => ({
        id: hashtag.id,
        name: hashtag.name,
        nameAr: hashtag.nameAr,
        articlesCount: hashtag.articlesCount,
      }));

      if (type === 'hashtags') {
        results.pagination = {
          page,
          limit,
          total: hashtagsCount,
          totalPages: Math.ceil(hashtagsCount / limit),
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء البحث' },
      { status: 500 },
    );
  }
}
