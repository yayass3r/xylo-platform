'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCodeErrorPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">خطأ في المصادقة</CardTitle>
          <CardDescription>
            حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            قد يكون هذا بسبب:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• انتهاء صلاحية رابط المصادقة</li>
            <li>• إلغاء عملية تسجيل الدخول</li>
            <li>• مشكلة في الاتصال بالمخدم</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              العودة لتسجيل الدخول
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              الصفحة الرئيسية
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
