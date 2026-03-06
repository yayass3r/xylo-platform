import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { addCoins } from '@/lib/wallet';

// POST: شراء عملات
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { packageId, paymentMethodId } = body;

    if (!packageId) {
      return apiError('يرجى اختيار باقة الشراء');
    }

    // الحصول على معلومات الباقة
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage || !coinPackage.isActive) {
      return apiError('الباقة غير متاحة');
    }

    // في بيئة الإنتاج، هنا يتم الربط مع Stripe أو Moyasar
    // للتجربة، سنفترض أن الدفع تم بنجاح
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // إضافة العملات
    const totalCoins = coinPackage.coins + coinPackage.bonus;
    const result = await addCoins(
      authResult.user!.id,
      totalCoins,
      paymentReference,
      'STRIPE_TEST'
    );

    // إنشاء سجل المعاملة
    await prisma.transaction.create({
      data: {
        walletId: (await prisma.wallet.findUnique({ where: { userId: authResult.user!.id } }))!.id,
        type: 'PURCHASE',
        amount: totalCoins,
        currency: 'COINS',
        status: 'COMPLETED',
        paymentMethod: 'STRIPE_TEST',
        paymentReference,
        description: `شراء ${coinPackage.name} - ${totalCoins} عملة`,
        metadata: {
          packageId,
          packageName: coinPackage.name,
          price: coinPackage.price,
        },
      },
    });

    return apiResponse(
      {
        coins: totalCoins,
        newBalance: result.newBalance,
        paymentReference,
      },
      'تم شراء العملات بنجاح'
    );
  } catch (error) {
    console.error('Purchase coins error:', error);
    return apiError('حدث خطأ أثناء عملية الشراء', 500);
  }
}
