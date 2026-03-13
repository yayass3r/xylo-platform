'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm, RegisterForm } from '@/types';

interface AuthModalsProps {
  showLogin: boolean;
  showRegister: boolean;
  loading: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  onLogin: (form: LoginForm) => void;
  onRegister: (form: RegisterForm) => void;
}

export function AuthModals({
  showLogin,
  showRegister,
  loading,
  onCloseLogin,
  onCloseRegister,
  onSwitchToRegister,
  onSwitchToLogin,
  onLogin,
  onRegister,
}: AuthModalsProps) {
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: '',
    password: '',
    name: '',
    referralCode: '',
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginForm);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(registerForm);
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={showLogin} onOpenChange={onCloseLogin}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تسجيل الدخول</DialogTitle>
            <DialogDescription>
              أدخل بيانات حسابك للوصول إلى منصة زايلو
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">البريد الإلكتروني</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="example@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">كلمة المرور</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <Button variant="link" className="p-0 h-auto" onClick={onSwitchToRegister}>
                إنشاء حساب جديد
              </Button>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegister} onOpenChange={onCloseRegister}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">إنشاء حساب جديد</DialogTitle>
            <DialogDescription>
              انضم إلى زايلو وابدأ رحلتك في صناعة المحتوى العربي
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">الاسم</Label>
              <Input
                id="register-name"
                type="text"
                placeholder="اسمك الكامل"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">البريد الإلكتروني</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="example@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">كلمة المرور</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={8}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-referral">كود الإحالة (اختياري)</Label>
              <Input
                id="register-referral"
                type="text"
                placeholder="XXXXXXXX"
                value={registerForm.referralCode}
                onChange={(e) => setRegisterForm({ ...registerForm, referralCode: e.target.value.toUpperCase() })}
                maxLength={8}
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Button variant="link" className="p-0 h-auto" onClick={onSwitchToLogin}>
                تسجيل الدخول
              </Button>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
