import { NextRequest, NextResponse } from 'next/server';
import { withAuth, apiResponse, apiError, getPaginationParams } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

/**
 * GET /api/follow
 * الحصول على قائمة المتابعين أو المتابعين
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'followers'; // followers or following
    const userId = searchParams.get('userId') || authResult.user!.id;
    const { page, limit, skip } = getPaginationParams(request);

    let follows;
    let totalCount;

    if (type === 'followers') {
      // الحصول على المتابعين
      totalCount = await prisma.follow.count({
        where: { followingId: userId },
      });

      follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // الحصول على المتابعين
      totalCount = await prisma.follow.count({
        where: { followerId: userId },
      });

      follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              bio: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    }

    const users = follows.map((follow: any) => ({
      ...follow[type === 'followers' ? 'follower' : 'following'],
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get follows error:', error);
    return apiError('حدث خطأ أثناء جلب البيانات');
  }
}

/**
 * POST /api/follow
 * متابعة أو إلغاء متابعة مستخدم
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return apiError('معرف المستخدم مطلوب');
    }

    const currentUserId = authResult.user!.id;

    // لا يمكن للمستخدم متابعة نفسه
    if (currentUserId === targetUserId) {
      return apiError('لا يمكنك متابعة نفسك');
    }

    // التحقق من وجود المستخدم المستهدف
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return apiError('المستخدم غير موجود');
    }

    // التحقق من وجود علاقة متابعة سابقة
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // إلغاء المتابعة
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      return NextResponse.json({
        success: true,
        message: 'تم إلغاء المتابعة',
        data: { isFollowing: false },
      });
    } else {
      // إنشاء متابعة جديدة
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تمت المتابعة بنجاح',
        data: { isFollowing: true },
      });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return apiError('حدث خطأ أثناء العملية');
  }
}

/**
 * DELETE /api/follow
 * إلغاء متابعة مستخدم
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return apiError('معرف المستخدم مطلوب');
    }

    const currentUserId = authResult.user!.id;

    // حذف المتابعة
    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      return apiError('لا توجد علاقة متابعة');
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء المتابعة',
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return apiError('حدث خطأ أثناء إلغاء المتابعة');
  }
}
