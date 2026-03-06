import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get current user profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('يرجى تسجيل الدخول');
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        wallet: true,
        _count: {
          select: {
            articles: true,
            receivedGifts: true,
          },
        },
      },
    });

    return successResponse(fullUser);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('حدث خطأ أثناء جلب البيانات');
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('يرجى تسجيل الدخول');
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { name, username, bio, avatar } = validation.data;

    // Check if username is taken
    if (username && username !== user.username) {
      const existingUsername = await db.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return errorResponse('اسم المستخدم مستخدم بالفعل');
      }
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        bio,
        avatar,
      },
    });

    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
    }, 'تم تحديث البيانات بنجاح');
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('حدث خطأ أثناء تحديث البيانات');
  }
}

// PATCH - Change password
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('يرجى تسجيل الدخول');
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message);
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return unauthorizedResponse();
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, fullUser.password);
    if (!isValid) {
      return errorResponse('كلمة المرور الحالية غير صحيحة');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse(null, 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('حدث خطأ أثناء تغيير كلمة المرور');
  }
}
