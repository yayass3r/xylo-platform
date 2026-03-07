import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/stats
 * إحصائيات لوحة الإدارة
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 });
    }

    // إحصائيات المستخدمين
    const usersCount = await prisma.user.count();
    const writersCount = await prisma.user.count({ where: { role: 'WRITER' } });
    const readersCount = await prisma.user.count({ where: { role: 'USER' } });
    const activeUsersCount = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const bannedUsersCount = await prisma.user.count({ where: { status: 'BANNED' } });

    // إحصائيات المقالات
    const articlesCount = await prisma.article.count();
    const publishedArticlesCount = await prisma.article.count({ where: { status: 'PUBLISHED' } });
    const pendingArticlesCount = await prisma.article.count({ where: { status: 'PENDING' } });
    const draftArticlesCount = await prisma.article.count({ where: { status: 'DRAFT' } });

    // إحصائيات الهدايا
    const giftsStats = await prisma.sentGift.aggregate({
      _sum: { diamondAmount: true, coinAmount: true },
      _count: { id: true },
    });

    // إحصائيات السحوبات
    const pendingWithdrawalsCount = await prisma.withdrawalRequest.count({
      where: { status: 'PENDING' },
    });
    const withdrawalsStats = await prisma.withdrawalRequest.aggregate({
      where: { status: 'PAID' },
      _sum: { netAmount: true },
    });

    // إحصائيات المعاملات المالية
    const transactionsStats = await prisma.transaction.aggregate({
      where: { type: 'PURCHASE', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    // إحصائيات الإيرادات
    const platformRevenue = await prisma.platformRevenue.aggregate({
      _sum: { netRevenue: true },
    });

    // المستخدمين الجدد (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // إحصائيات المشاهدات
    const viewsStats = await prisma.article.aggregate({
      _sum: { viewsCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: usersCount,
          writers: writersCount,
          readers: readersCount,
          active: activeUsersCount,
          banned: bannedUsersCount,
          newThisMonth: newUsersThisMonth,
        },
        articles: {
          total: articlesCount,
          published: publishedArticlesCount,
          pending: pendingArticlesCount,
          draft: draftArticlesCount,
          totalViews: viewsStats._sum.viewsCount || 0,
        },
        gifts: {
          total: giftsStats._count.id || 0,
          totalDiamonds: giftsStats._sum.diamondAmount || 0,
          totalCoins: giftsStats._sum.coinAmount || 0,
        },
        withdrawals: {
          pending: pendingWithdrawalsCount,
          totalPaid: withdrawalsStats._sum.netAmount || 0,
        },
        transactions: {
          totalPurchased: transactionsStats._sum.amount || 0,
        },
        revenue: {
          total: platformRevenue._sum.netRevenue || 0,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
