import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'latest';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (category) where.category = category;
    if (authorId) where.authorId = authorId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, unknown> = { publishedAt: 'desc' };
    if (sort === 'popular') orderBy = { views: 'desc' };
    if (sort === 'mostLiked') orderBy = { likes: 'desc' };
    if (sort === 'mostGifted') orderBy = { giftValue: 'desc' };

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المقالات' },
      { status: 500 }
    );
  }
}

// Create article
const createArticleSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  content: z.string().min(50, 'المحتوى يجب أن يكون 50 حرف على الأقل'),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check if user can create articles
    if (user.role === 'USER') {
      // Upgrade to creator on first article
      await db.user.update({
        where: { id: user.id },
        data: { role: 'CREATOR' },
      });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, category, tags, status } = createArticleSchema.parse(body);

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();

    const article = await db.article.create({
      data: {
        authorId: user.id,
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        coverImage: coverImage || null,
        category: category || null,
        tags: tags || [],
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'خطأ في التحقق من البيانات' },
        { status: 400 }
      );
    }
    console.error('Create article error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المقال' },
      { status: 500 }
    );
  }
}
