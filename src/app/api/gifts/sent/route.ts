import { NextRequest } from 'next/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get sent gifts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const [gifts, total] = await Promise.all([
      db.sentGift.findMany({
        where: { senderId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          gift: true,
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      db.sentGift.count({ where: { senderId: user.id } }),
    ]);

    // Calculate total coins spent
    const totalCoins = gifts.reduce((sum, g) => sum + g.gift.coinCost, 0);

    return successResponse({
      gifts,
      totalCoins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get sent gifts error:', error);
    return errorResponse('حدث خطأ أثناء جلب الهدايا');
  }
}
