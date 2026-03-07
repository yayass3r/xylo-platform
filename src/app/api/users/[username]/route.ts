import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/users/[username]
 * الحصول على الملف الشخصي العام للمستخدم
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'اسم المستخدم مطلوب' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        isKycVerified: true,
        createdAt: true,
        _count: {
          select: {
            articles: { where: { status: 'PUBLISHED' } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 404 },
      );
    }

    // إخفاء المستخدمين المحظورين
    if (user.status === 'BANNED') {
      return NextResponse.json(
        { success: false, message: 'هذا الحساب غير متاح' },
        { status: 404 },
      );
    }

    // الحصول على آخر المقالات
    const recentArticles = await prisma.article.findMany({
      where: {
        authorId: user.id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        viewsCount: true,
        readTime: true,
        createdAt: true,
        _count: {
          select: { gifts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isKycVerified: user.isKycVerified,
      joinedAt: user.createdAt,
      stats: {
        articlesCount: user._count.articles,
        followersCount: user._count.followers,
        followingCount: user._count.following,
      },
      recentArticles: recentArticles.map((article: any) => ({
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
      })),
    };

    return NextResponse.json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 },
    );
  }
}
