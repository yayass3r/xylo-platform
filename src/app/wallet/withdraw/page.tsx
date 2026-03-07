'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Wallet,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  DiamondsIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WalletData {
  diamondsBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [diamondsAmount, setDiamondsAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/wallet', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setWallet(data.data.wallet);
        }
      } catch (err) {
        console.error('Failed to fetch wallet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseInt(diamondsAmount);
    if (!amount || amount < 100) {
      setError('الحد الأدنى للسحب هو 100 ألماس');
      return;
    }

    if (wallet && amount > wallet.diamondsBalance) {
      setError('رصيد الألماس غير كافٍ');
      return;
    }

    if (!withdrawalMethod) {
      setError('يرجى اختيار طريقة السحب');
      return;
    }

    if (!accountDetails.trim()) {
      setError('يرجى إدخال بيانات الحساب');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diamondAmount: amount,
          withdrawalMethod,
          accountDetails,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess('تم تقديم طلب السحب بنجاح. سيتم مراجعته خلال 24-48 ساعة.');
        setDiamondsAmount('');
        setWithdrawalMethod('');
        setAccountDetails('');
        // Refresh wallet
        if (wallet) {
          setWallet({
            ...wallet,
            diamondsBalance: wallet.diamondsBalance - amount,
          });
        }
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تقديم الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حساب القيمة بالدولار (1 ألماس = 0.01 دولار)
  const usdValue = (parseInt(diamondsAmount) || 0) * 0.01;
  const platformFee = usdValue * 0.10; // 10% عمولة
  const netAmount = usdValue - platformFee;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  زايلو
                </span>
              </Link>
              <span className="text-slate-400">|</span>
              <h1 className="text-lg font-medium">طلب سحب أرباح</h1>
            </div>

            <Button variant="ghost" asChild>
              <Link href="/wallet" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                المحفظة
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              رصيدك الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-600">
                  {(wallet?.diamondsBalance || 0).toLocaleString()}
                </div>
                <div className="text-muted-foreground">ألماس</div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  ${((wallet?.diamondsBalance || 0) * 0.01).toFixed(2)}
                </div>
                <div className="text-muted-foreground text-sm">قيمة بالدولار</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>طلب سحب جديد</CardTitle>
            <CardDescription>
              الحد الأدنى للسحب: 100 ألماس ($1)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">كمية الألماس للسحب</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="1"
                  placeholder="100"
                  value={diamondsAmount}
                  onChange={(e) => setDiamondsAmount(e.target.value)}
                />
                {parseInt(diamondsAmount) >= 100 && (
                  <div className="bg-slate-50 rounded-lg p-4 mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>القيمة بالدولار:</span>
                      <span>${usdValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>عمولة المنصة (10%):</span>
                      <span>-${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>صافي المبلغ:</span>
                      <span className="text-green-600">${netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>طريقة السحب</Label>
                <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة السحب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">تحويل بنكي</SelectItem>
                    <SelectItem value="wise">Wise</SelectItem>
                    <SelectItem value="payoneer">Payoneer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">بيانات الحساب</Label>
                <Input
                  id="account"
                  placeholder={
                    withdrawalMethod === 'paypal' 
                      ? 'البريد الإلكتروني PayPal'
                      : withdrawalMethod === 'bank'
                        ? 'IBAN / رقم الحساب البنكي'
                        : 'البريد الإلكتروني أو رقم الحساب'
                  }
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>ملاحظة:</strong> سيتم مراجعة طلبك خلال 24-48 ساعة عمل. 
                  تأكد من صحة بيانات حسابك قبل الإرسال.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال الطلب'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
