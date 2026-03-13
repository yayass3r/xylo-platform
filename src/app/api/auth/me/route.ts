import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح', user: null },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من المصادقة', user: null },
      { status: 500 }
    );
  }
}
