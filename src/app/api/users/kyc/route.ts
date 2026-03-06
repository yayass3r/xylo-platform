import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { kycSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get KYC status
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('يرجى تسجيل الدخول');
    }

    const kyc = await db.kycVerification.findUnique({
      where: { userId: user.id },
    });

    return successResponse(kyc);
  } catch (error) {
    console.error('Get KYC error:', error);
    return errorResponse('حدث خطأ أثناء جلب البيانات');
  }
}

// POST - Submit KYC
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('يرجى تسجيل الدخول');
    }

    // Check if already has pending or approved KYC
    const existingKyc = await db.kycVerification.findUnique({
      where: { userId: user.id },
    });

    if (existingKyc) {
      if (existingKyc.status === 'APPROVED') {
        return errorResponse('تم التحقق من هويتك بالفعل');
      }
      if (existingKyc.status === 'PENDING') {
        return errorResponse('لديك طلب قيد المراجعة');
      }
    }

    const body = await request.json();
    const validation = kycSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { idType, idFrontImage, idBackImage, selfieImage } = validation.data;

    const kyc = await db.kycVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        idType,
        idFrontImage,
        idBackImage,
        selfieImage,
        status: 'PENDING',
      },
      update: {
        idType,
        idFrontImage,
        idBackImage,
        selfieImage,
        status: 'PENDING',
        adminNotes: null,
        reviewedAt: null,
      },
    });

    return successResponse(kyc, 'تم إرسال طلب التحقق بنجاح', 201);
  } catch (error) {
    console.error('Submit KYC error:', error);
    return errorResponse('حدث خطأ أثناء إرسال الطلب');
  }
}
