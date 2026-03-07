import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/writer/stats
 * إحصائيات الكاتب
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 });
    }

    // جلب إحصائيات المقالات
    const articlesStats = await prisma.article.aggregate({
      where: { authorId: payload.userId },
      _count: { id: true },
      _sum: { viewsCount: true },
    });

    const publishedCount = await prisma.article.count({
      where: { authorId: payload.userId, status: 'PUBLISHED' },
    });

    const draftCount = await prisma.article.count({
      where: { authorId: payload.userId, status: 'DRAFT' },
    });

    const pendingCount = await prisma.article.count({
      where: { authorId: payload.userId, status: 'PENDING' },
    });

    // جلب الهدايا المستلمة
    const giftsReceived = await prisma.sentGift.aggregate({
      where: { receiverId: payload.userId },
      _sum: { diamondAmount: true },
      _count: { id: true },
    });

    // جلب رصيد المحفظة
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    // جلب إجمالي السحوبات
    const withdrawals = await prisma.withdrawalRequest.aggregate({
      where: { 
        userId: payload.userId,
        status: { in: ['PAID', 'APPROVED'] }
      },
      _sum: { netAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalArticles: articlesStats._count.id || 0,
        publishedArticles: publishedCount,
        draftArticles: draftCount,
        pendingArticles: pendingCount,
        totalViews: articlesStats._sum.viewsCount || 0,
        totalGifts: giftsReceived._count.id || 0,
        diamondsBalance: wallet?.diamondsBalance || 0,
        totalEarned: (wallet?.totalEarned || 0),
        totalWithdrawn: Math.round((withdrawals._sum.netAmount || 0) * 100),
      },
    });
  } catch (error) {
    console.error('Writer stats error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
