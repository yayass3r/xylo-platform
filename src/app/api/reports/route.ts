import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, name: true, displayName: true, avatar: true },
          },
          reported: {
            select: { id: true, name: true, displayName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البلاغات' }, { status: 500 });
  }
}

// Create report
const createReportSchema = z.object({
  reportedId: z.string(),
  type: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT', 'MISINFORMATION', 'OTHER']),
  reason: z.string().min(10, 'السبب يجب أن يكون 10 أحرف على الأقل').max(500),
  targetType: z.enum(['ARTICLE', 'COMMENT', 'USER']),
  targetId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const data = createReportSchema.parse(body);

    // Prevent reporting yourself
    if (data.reportedId === user.id) {
      return NextResponse.json({ error: 'لا يمكنك الإبلاغ عن نفسك' }, { status: 400 });
    }

    // Check if already reported
    const existingReport = await db.report.findFirst({
      where: {
        reporterId: user.id,
        targetId: data.targetId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: 'لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً' }, { status: 400 });
    }

    const report = await db.report.create({
      data: {
        reporterId: user.id,
        reportedId: data.reportedId,
        type: data.type,
        reason: data.reason,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء البلاغ' }, { status: 500 });
  }
}

// Update report status (admin only)
const updateReportSchema = z.object({
  reportId: z.string(),
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
  action: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, status, action } = updateReportSchema.parse(body);

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status,
        action,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث البلاغ' }, { status: 500 });
  }
}
