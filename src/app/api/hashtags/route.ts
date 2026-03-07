import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdminAuth, getPaginationParams } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

/**
 * GET /api/hashtags
 * الحصول على قائمة الهاشتاقات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'trending'; // trending, all
    const { page, limit, skip } = getPaginationParams(request);

    let hashtags;
    let totalCount;

    if (type === 'trending') {
      // الهاشتاقات الرائجة
      totalCount = await prisma.hashtag.count({
        where: { isActive: true },
      });

      hashtags = await prisma.hashtag.findMany({
        where: { isActive: true },
        orderBy: { articlesCount: 'desc' },
        skip,
        take: limit,
      });
    } else {
      // جميع الهاشتاقات
      totalCount = await prisma.hashtag.count();

      hashtags = await prisma.hashtag.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
    }

    return NextResponse.json({
      success: true,
      data: hashtags,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get hashtags error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الهاشتاقات' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/hashtags
 * إنشاء هاشتاق جديد (للمسؤولين فقط)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { name, nameAr } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'اسم الهاشتاق مطلوب' },
        { status: 400 },
      );
    }

    // التحقق من عدم وجود الهاشتاق
    const existingHashtag = await prisma.hashtag.findUnique({
      where: { name: name.toLowerCase() },
    });

    if (existingHashtag) {
      return NextResponse.json(
        { success: false, message: 'الهاشتاق موجود بالفعل' },
        { status: 400 },
      );
    }

    const hashtag = await prisma.hashtag.create({
      data: {
        name: name.toLowerCase(),
        nameAr: nameAr || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الهاشتاق بنجاح',
      data: hashtag,
    });
  } catch (error) {
    console.error('Create hashtag error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إنشاء الهاشتاق' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/hashtags
 * تحديث هاشتاق (للمسؤولين فقط)
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { id, name, nameAr, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الهاشتاق مطلوب' },
        { status: 400 },
      );
    }

    const hashtag = await prisma.hashtag.update({
      where: { id },
      data: {
        name: name ? name.toLowerCase() : undefined,
        nameAr,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الهاشتاق بنجاح',
      data: hashtag,
    });
  } catch (error) {
    console.error('Update hashtag error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث الهاشتاق' },
      { status: 500 },
    );
  }
}
