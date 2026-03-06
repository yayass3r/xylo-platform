import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withWriterAuth, apiResponse, apiError, getPaginationParams } from '@/lib/api-utils';

// GET: قائمة المقالات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const where: Record<string, unknown> = {};

    // فلترة حسب الحالة (الافتراضي: المنشورة فقط للعموم)
    if (status) {
      where.status = status;
    } else {
      where.status = 'PUBLISHED';
    }

    if (category) {
      where.category = category;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              gifts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return apiResponse({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    return apiError('حدث خطأ أثناء جلب المقالات', 500);
  }
}

// POST: إنشاء مقال جديد
export async function POST(request: NextRequest) {
  try {
    const authResult = await withWriterAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, category, tags, isPaid } = body;

    if (!title || !content) {
      return apiError('العنوان والمحتوى مطلوبان');
    }

    // إنشاء slug فريد
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // حساب وقت القراءة (كلمة واحدة = 0.5 دقيقة تقريباً)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        coverImage,
        category,
        tags: tags || [],
        isPaid: isPaid || false,
        authorId: authResult.user!.id,
        status: 'DRAFT',
        readTime,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return apiResponse({ article }, 'تم إنشاء المقال بنجاح', 201);
  } catch (error) {
    console.error('Create article error:', error);
    return apiError('حدث خطأ أثناء إنشاء المقال', 500);
  }
}
