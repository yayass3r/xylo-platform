import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { withdrawalService } from '@/lib/financial/withdrawal-service';
import { referralService } from '@/lib/referral/referral-service';
import { prisma } from '@/lib/db';

/**
 * GET: إحصائيات مالية شاملة للوحة الإدارة
 */
export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    // إحصائيات إيرادات المنصة
    const revenueStats = await withdrawalService.getPlatformRevenueStats();

    // إحصائيات الإحالات
    const topReferrers = await referralService.getTopReferrers(10);

    // إحصائيات عامة
    const [
      totalUsers,
      totalWriters,
      totalCoinsPurchased,
      totalDiamondsEarned,
      totalGiftsSent,
      pendingWithdrawals,
      pendingWithdrawalAmount,
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count(),

      // إجمالي الكتاب
      prisma.user.count({ where: { role: 'WRITER' } }),

      // إجمالي العملات المشتراة
      prisma.wallet.aggregate({
        _sum: { totalPurchased: true },
      }),

      // إجمالي الألماس المكتسب
      prisma.wallet.aggregate({
        _sum: { totalEarned: true },
      }),

      // إجمالي الهدايا المرسلة
      prisma.sentGift.count(),

      // طلبات السحب المعلقة
      prisma.withdrawalRequest.count({
        where: { status: 'PENDING' },
      }),

      // قيمة طلبات السحب المعلقة
      prisma.withdrawalRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { usdValue: true },
      }),
    ]);

    // إحصائيات الشراء اليومية (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyPurchases = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'PURCHASE',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: true,
    });

    // إحصائيات السحب حسب الحالة
    const withdrawalsByStatus = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      _count: true,
      _sum: { usdValue: true },
    });

    // إحصائيات المكافآت
    const rewardsStats = await prisma.referralReward.aggregate({
      where: { status: 'AWARDED' },
      _sum: { rewardCoins: true },
      _count: { _all: true },
    });

    // إحصائيات الحزم الأكثر مبيعاً
    const topPackages = await prisma.transaction.groupBy({
      by: ['metadata'],
      where: { type: 'PURCHASE', status: 'COMPLETED' },
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return apiResponse({
      overview: {
        totalUsers,
        totalWriters,
        totalCoinsPurchased: totalCoinsPurchased._sum.totalPurchased || 0,
        totalDiamondsEarned: totalDiamondsEarned._sum.totalEarned || 0,
        totalGiftsSent,
      },
      financial: {
        platformRevenue: revenueStats.totalRevenue,
        withdrawalCommission: revenueStats.totalWithdrawalCommission,
        pendingWithdrawals,
        pendingWithdrawalAmount: pendingWithdrawalAmount._sum.usdValue || 0,
        withdrawalsByStatus: withdrawalsByStatus.map((w) => ({
          status: w.status,
          count: w._count,
          totalUsd: w._sum.usdValue || 0,
        })),
      },
      referral: {
        totalRewardsAwarded: rewardsStats._sum.rewardCoins || 0,
        totalRewardsCount: rewardsStats._count._all,
        topReferrers,
      },
      dailyPurchases: dailyPurchases.map((p) => ({
        date: p.createdAt,
        amount: p._sum.amount || 0,
        count: p._count,
      })),
      topPackages: topPackages.map((p) => ({
        packageName: (p.metadata as any)?.packageName || 'غير معروف',
        count: p._count,
        totalCoins: p._sum.amount || 0,
      })),
    });
  } catch (error) {
    console.error('Admin financial stats error:', error);
    return apiError('فشل في جلب الإحصائيات المالية', 500);
  }
}
