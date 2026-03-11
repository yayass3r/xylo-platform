import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const currentUser = await getCurrentUser();

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        socialLinks: true,
        role: true,
        isVerified: true,
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
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    // Get wallet stats (only for own profile)
    let walletStats = null;
    if (currentUser && currentUser.id === userId) {
      const wallet = await db.wallet.findUnique({
        where: { userId },
        select: {
          malcoinBalance: true,
          quscoinBalance: true,
          totalEarned: true,
        },
      });
      walletStats = wallet;
    }

    // Get recent articles
    const recentArticles = await db.article.findMany({
      where: { authorId: userId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        views: true,
        likes: true,
        giftCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Get total stats
    const stats = await db.article.aggregate({
      where: { authorId: userId, status: 'PUBLISHED' },
      _sum: {
        views: true,
        likes: true,
        giftCount: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        isFollowing,
        walletStats,
        recentArticles,
        stats: {
          totalViews: stats._sum.views || 0,
          totalLikes: stats._sum.likes || 0,
          totalGifts: stats._sum.giftCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم' }, { status: 500 });
  }
}

// Update profile
const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...data,
        socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : undefined,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الملف الشخصي' }, { status: 500 });
  }
}

// Search users
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { displayName: { contains: query } },
          { email: { contains: query } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatar: true,
        isVerified: true,
        role: true,
        _count: {
          select: { followers: true },
        },
      },
      skip,
      take: limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 });
  }
}
