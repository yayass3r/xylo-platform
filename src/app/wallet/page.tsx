'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Diamond,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  History,
  Loader2,
  Gift,
  ShoppingCart,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WalletData {
  coinsBalance: number;
  diamondsBalance: number;
  totalPurchased: number;
  totalSpent: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface CoinPackage {
  id: string;
  name: string;
  nameAr: string | null;
  coins: number;
  price: number;
  bonus: number;
  currency: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      // Fetch wallet
      const walletRes = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const walletData = await walletRes.json();
      if (walletData.success) {
        setWallet(walletData.data);
      }

      // Fetch transactions
      const txRes = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txData = await txRes.json();
      if (txData.success) {
        setTransactions(txData.data);
      }

      // Fetch coin packages
      const packagesRes = await fetch('/api/coins/packages');
      const packagesData = await packagesRes.json();
      if (packagesData.success) {
        setCoinPackages(packagesData.data);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch('/api/wallet/purchase-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });

      const data = await response.json();
      if (data.success) {
        // تحديث الرصيد
        fetchData(token);
        setSelectedPackage(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      case 'TIP':
        return <Gift className="w-5 h-5 text-pink-500" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'REFUND':
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case 'REFERRAL_BONUS':
        return <Gift className="w-5 h-5 text-green-500" />;
      default:
        return <Coins className="w-5 h-5 text-amber-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'شراء عملات';
      case 'TIP':
        return 'إرسال هدية';
      case 'WITHDRAWAL':
        return 'سحب أرباح';
      case 'REFUND':
        return 'استرداد';
      case 'REFERRAL_BONUS':
        return 'مكافأة إحالة';
      case 'ADMIN_ADJUSTMENT':
        return 'تعديل إداري';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">المحفظة</h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Coins Balance */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Coins className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600">رصيد العملات</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {wallet?.coinsBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      <CreditCard className="w-4 h-4 ml-2" />
                      شراء عملات
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>شراء عملات</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {coinPackages.map((pkg) => (
                        <Card
                          key={pkg.id}
                          className={`cursor-pointer transition-all ${
                            selectedPackage?.id === pkg.id
                              ? 'ring-2 ring-violet-500'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">💰</div>
                            <p className="font-bold text-lg">{pkg.coins.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">عملة</p>
                            {pkg.bonus > 0 && (
                              <Badge className="bg-green-500 mt-2">
                                +{pkg.bonus} مجاناً
                              </Badge>
                            )}
                            <p className="text-lg font-bold text-violet-600 mt-2">
                              ${pkg.price}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {selectedPackage && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between mb-2">
                          <span>العملات:</span>
                          <span>{selectedPackage.coins.toLocaleString()}</span>
                        </div>
                        {selectedPackage.bonus > 0 && (
                          <div className="flex justify-between mb-2 text-green-600">
                            <span>مكافأة:</span>
                            <span>+{selectedPackage.bonus}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>الإجمالي:</span>
                          <span>${selectedPackage.price}</span>
                        </div>
                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-violet-600 to-indigo-600"
                          onClick={handlePurchase}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'إتمام الشراء'
                          )}
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">إجمالي المشتريات:</span>
                  <span className="font-bold mr-2">{wallet?.totalPurchased?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">إجمالي المنفق:</span>
                  <span className="font-bold mr-2">{wallet?.totalSpent?.toLocaleString() || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diamonds Balance (for writers) */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Diamond className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">رصيد الألماس</p>
                    <p className="text-2xl font-bold text-purple-700">
                      💎 {wallet?.diamondsBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/wallet/withdraw">
                    <DollarSign className="w-4 h-4 ml-2" />
                    سحب الأرباح
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">إجمالي المكتسب:</span>
                  <span className="font-bold mr-2">{wallet?.totalEarned?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">إجمالي المسحوب:</span>
                  <span className="font-bold mr-2">{wallet?.totalWithdrawn?.toLocaleString() || 0}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * الألماس يُحول إلى دولارات عند السحب (100 ألماس = $1)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              سجل المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="purchase">المشتريات</TabsTrigger>
                <TabsTrigger value="tip">الهدايا</TabsTrigger>
                <TabsTrigger value="withdrawal">السحوبات</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TransactionList transactions={transactions} getTransactionIcon={getTransactionIcon} getTransactionLabel={getTransactionLabel} />
              </TabsContent>
              <TabsContent value="purchase">
                <TransactionList
                  transactions={transactions.filter((t) => t.type === 'PURCHASE')}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionLabel={getTransactionLabel}
                />
              </TabsContent>
              <TabsContent value="tip">
                <TransactionList
                  transactions={transactions.filter((t) => t.type === 'TIP')}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionLabel={getTransactionLabel}
                />
              </TabsContent>
              <TabsContent value="withdrawal">
                <TransactionList
                  transactions={transactions.filter((t) => t.type === 'WITHDRAWAL')}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionLabel={getTransactionLabel}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransactionList({
  transactions,
  getTransactionIcon,
  getTransactionLabel,
}: {
  transactions: Transaction[];
  getTransactionIcon: (type: string) => JSX.Element;
  getTransactionLabel: (type: string) => string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد معاملات
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getTransactionIcon(tx.type)}
              <div>
                <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                {tx.description && (
                  <p className="text-sm text-muted-foreground">{tx.description}</p>
                )}
              </div>
            </div>
            <div className="text-left">
              <p
                className={`font-bold ${
                  tx.type === 'TIP' || tx.type === 'WITHDRAWAL'
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {tx.type === 'TIP' || tx.type === 'WITHDRAWAL' ? '-' : '+'}
                {tx.amount.toLocaleString()} {tx.currency === 'COINS' ? '🪙' : tx.currency === 'DIAMONDS' ? '💎' : '$'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
