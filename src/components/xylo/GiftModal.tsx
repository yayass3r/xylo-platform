'use client';

import { useState } from 'react';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift as GiftType, Article } from '@/types';
import { formatNumber } from '@/lib/constants';

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  article: Article | null;
  gifts: GiftType[];
  userBalance: number;
  loading: boolean;
  onSendGift: (giftId: string, message: string) => void;
}

export function GiftModal({
  open,
  onClose,
  article,
  gifts,
  userBalance,
  loading,
  onSendGift,
}: GiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift.id, message);
      setSelectedGift(null);
      setMessage('');
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setMessage('');
    onClose();
  };

  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            إرسال هدية
          </DialogTitle>
          <DialogDescription>
            اختر هدية لإرسالها للمؤلف كتقدير لمحتواه
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Article Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <p className="text-sm text-gray-600">المقال:</p>
              <p className="font-medium line-clamp-2">{article.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                للمؤلف: {article.author.displayName || article.author.name || 'مستخدم'}
              </p>
            </CardContent>
          </Card>
          
          {/* User Balance */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">رصيدك الحالي:</span>
            <Badge variant="outline" className="gap-1 bg-purple-50 border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              {formatNumber(userBalance)} MAL
            </Badge>
          </div>
          
          {/* Gift Selection */}
          <div className="space-y-2">
            <Label>اختر الهدية:</Label>
            <div className="grid grid-cols-4 gap-2">
              {gifts.map((gift) => (
                <Button
                  key={gift.id}
                  variant={selectedGift?.id === gift.id ? 'default' : 'outline'}
                  className={`h-auto flex-col py-3 px-2 ${
                    selectedGift?.id === gift.id
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : gift.cost > userBalance
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={gift.cost > userBalance}
                  onClick={() => setSelectedGift(gift)}
                >
                  <span className="text-2xl mb-1">{gift.icon}</span>
                  <span className="text-xs">{gift.nameAr}</span>
                  <Badge 
                    variant="secondary" 
                    className="mt-1 text-[10px] bg-white/20 text-current"
                  >
                    {formatNumber(gift.cost)} MAL
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="gift-message">رسالة (اختيارية)</Label>
            <Textarea
              id="gift-message"
              placeholder="اكتب رسالة شكر للمؤلف..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="resize-none"
              rows={2}
            />
            <p className="text-xs text-gray-500 text-left">
              {message.length}/200
            </p>
          </div>
          
          {/* Gift Value Info */}
          {selectedGift && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <div className="flex justify-between text-sm">
                  <span>قيمة الهدية:</span>
                  <span className="font-bold">{formatNumber(selectedGift.cost)} MAL</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>سيحصل المؤلف على:</span>
                  <span className="font-bold text-green-600">
                    {formatNumber(selectedGift.cost * 0.8)} QUS
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled={!selectedGift || loading}
            onClick={handleSend}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 ml-2" />
                إرسال الهدية
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
