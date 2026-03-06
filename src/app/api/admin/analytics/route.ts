import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

// GET: الإحصائيات
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // أيام

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // إحصائيات المستخدمين
    const [
      totalUsers,
      newUsers,
      activeWriters,
      totalArticles,
      publishedArticles,
      pendingArticles,
      totalViews,
      totalGifts,
      totalWithdrawals,
      pendingWithdrawals,
      pendingKyc,
      pendingReports,
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count(),
      // المستخدمين الجدد
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      // الكتاب النشطين
      prisma.user.count({
        where: { role: 'WRITER' },
      }),
      // إجمالي المقالات
      prisma.article.count(),
      // المقالات المنشورة
      prisma.article.count({
        where: { status: 'PUBLISHED' },
      }),
      // المقالات قيد المراجعة
      prisma.article.count({
        where: { status: 'PENDING' },
      }),
      // إجمالي المشاهدات
      prisma.article.aggregate({
        _sum: { viewsCount: true },
      }),
      // إجمالي الهدايا
      prisma.sentGift.count({
        where: { createdAt: { gte: startDate } },
      }),
      // إجمالي طلبات السحب
      prisma.withdrawalRequest.count(),
      // طلبات السحب المعلقة
      prisma.withdrawalRequest.count({
        where: { status: 'PENDING' },
      }),
      // طلبات KYC المعلقة
      prisma.kycVerification.count({
        where: { status: 'PENDING' },
      }),
      // البلاغات المعلقة
      prisma.report.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // إحصائيات يومية للمستخدمين الجدد
    const dailyNewUsers = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM User
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;

    // إحصائيات يومية للمقالات الجديدة
    const dailyNewArticles = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Article
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;

    return apiResponse({
      overview: {
        totalUsers,
        newUsers,
        activeWriters,
        totalArticles,
        publishedArticles,
        pendingArticles,
        totalViews: totalViews._sum.viewsCount || 0,
        totalGifts,
        totalWithdrawals,
        pendingWithdrawals,
        pendingKyc,
        pendingReports,
      },
      charts: {
        dailyNewUsers,
        dailyNewArticles,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return apiError('حدث خطأ أثناء جلب الإحصائيات', 500);
  }
}
