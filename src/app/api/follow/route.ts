import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get followers/following
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers'; // followers or following
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    if (type === 'followers') {
      const [followers, total] = await Promise.all([
        db.follow.findMany({
          where: { followingId: userId },
          include: {
            follower: {
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
        db.follow.count({ where: { followingId: userId } }),
      ]);

      return NextResponse.json({
        users: followers.map(f => ({ ...f.follower, followedAt: f.createdAt })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else {
      const [following, total] = await Promise.all([
        db.follow.findMany({
          where: { followerId: userId },
          include: {
            following: {
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
        db.follow.count({ where: { followerId: userId } }),
      ]);

      return NextResponse.json({
        users: following.map(f => ({ ...f.following, followedAt: f.createdAt })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  } catch (error) {
    console.error('Get follows error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 });
  }
}

// Follow/Unfollow user
const followSchema = z.object({
  targetUserId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = followSchema.parse(body);

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'لا يمكنك متابعة نفسك' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await db.follow.delete({
        where: { id: existingFollow.id },
      });

      return NextResponse.json({ success: true, action: 'unfollowed' });
    } else {
      // Follow
      await db.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            followerId: user.id,
            followingId: targetUserId,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: 'NEW_FOLLOWER',
            title: 'متابع جديد! 👋',
            message: `${user.name || user.email} بدأ بمتابعتك`,
            data: JSON.stringify({ followerId: user.id }),
          },
        });
      });

      return NextResponse.json({ success: true, action: 'followed' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء العملية' }, { status: 500 });
  }
}

// Check if following
export async function HEAD(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isFollowing: false });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Check follow error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
