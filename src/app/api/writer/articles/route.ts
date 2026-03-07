import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getPaginationParams } from '@/lib/api-utils';

/**
 * GET /api/writer/articles
 * مقالات الكاتب
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

    const { page, limit, skip } = getPaginationParams(request);
    const status = request.nextUrl.searchParams.get('status');

    const where: any = { authorId: payload.userId };
    if (status) {
      where.status = status;
    }

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { gifts: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        viewsCount: a.viewsCount,
        category: a.category,
        coverImage: a.coverImage,
        createdAt: a.createdAt,
        gifts: { count: a._count.gifts },
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Writer articles error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب المقالات' },
      { status: 500 }
    );
  }
}
