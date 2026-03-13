'use client';

import { useState } from 'react';
import {
  Wallet,
  ArrowUpDown,
  DollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Transaction, TRANSACTION_TYPE_LABELS, formatNumber, formatDate } from '@/lib/constants';

interface WalletSectionProps {
  wallet: {
    malcoinBalance: number;
    quscoinBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    quscoinUSDValue: number;
  } | null;
  transactions: Transaction[];
  loading: boolean;
  onWithdraw: () => void;
  onRecharge: () => void;
}

export function WalletSection({
  wallet,
  transactions,
  loading,
  onWithdraw,
  onRecharge,
}: WalletSectionProps) {
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-20">
        <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">لم يتم العثور على المحفظة</p>
      </div>
    );
  }

  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions.slice(0, 10);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MALCOIN Balance */}
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">رصيد MALCOIN</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(wallet.malcoinBalance)}
                </p>
                <p className="text-purple-200 text-sm mt-1">
                  ≈ ${(wallet.malcoinBalance / 500).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUSCOIN Balance */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">رصيد QUSCOIN</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(wallet.quscoinBalance)}
                </p>
                <p className="text-amber-200 text-sm mt-1">
                  ≈ ${(wallet.quscoinBalance / 500).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي الأرباح</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(wallet.totalEarned)}
                </p>
                <p className="text-green-200 text-sm mt-1">QUS</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Withdrawn */}
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي المسحوبات</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(wallet.totalWithdrawn)}
                </p>
                <p className="text-blue-200 text-sm mt-1">QUS</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          onClick={onRecharge}
        >
          <Sparkles className="w-4 h-4 ml-2" />
          شحن MALCOIN
        </Button>
        <Button
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          onClick={onWithdraw}
        >
          <DollarSign className="w-4 h-4 ml-2" />
          سحب QUSCOIN
        </Button>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            سجل المعاملات
          </CardTitle>
          {transactions.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTransactions(!showAllTransactions)}
            >
              {showAllTransactions ? 'عرض أقل' : 'عرض الكل'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد معاملات حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTransactions.map((tx, index) => (
                  <div key={tx.id}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'RECHARGE' || tx.type === 'GIFT_RECEIVED' || tx.type === 'REFERRAL_BONUS'
                            ? 'bg-green-100 text-green-600'
                            : tx.type === 'WITHDRAWAL' || tx.type === 'GIFT_SENT'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {tx.type === 'RECHARGE' && <Sparkles className="w-5 h-5" />}
                          {tx.type === 'GIFT_SENT' && <ArrowUpDown className="w-5 h-5" />}
                          {tx.type === 'GIFT_RECEIVED' && <ArrowUpDown className="w-5 h-5" />}
                          {tx.type === 'WITHDRAWAL' && <DollarSign className="w-5 h-5" />}
                          {tx.type === 'REFERRAL_BONUS' && <TrendingUp className="w-5 h-5" />}
                          {tx.type === 'COMMISSION' && <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                          </p>
                          {tx.description && (
                            <p className="text-sm text-gray-500">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${
                          tx.type === 'RECHARGE' || tx.type === 'GIFT_RECEIVED' || tx.type === 'REFERRAL_BONUS'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {tx.type === 'RECHARGE' || tx.type === 'GIFT_RECEIVED' || tx.type === 'REFERRAL_BONUS'
                            ? '+'
                            : '-'
                          }
                          {formatNumber(tx.amount)} {tx.currency === 'MALCOIN' ? 'MAL' : 'QUS'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    {index < displayedTransactions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
