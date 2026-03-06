'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut, getCurrentUser, onAuthStateChange } from '@/lib/supabase/client';
import {
  BookOpen,
  Coins,
  Gift,
  TrendingUp,
  Clock,
  User,
  Search,
  Menu,
  X,
  Bell,
  Wallet,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// بيانات تجريبية للعرض
const featuredArticles = [
  {
    id: '1',
    title: 'كيف تبدأ رحلتك في الكتابة الإبداعية',
    excerpt: 'اكتشف أسرار الكتابة الإبداعية وكيف تطور مهاراتك في عالم الأدب...',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
    author: { name: 'أحمد محمد', username: 'ahmed_writer', avatar: null },
    category: 'إبداع',
    readTime: 8,
    viewsCount: 1250,
    giftsCount: 45,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'الذكاء الاصطناعي ومستقبل صناعة المحتوى',
    excerpt: 'رحلة في عالم الذكاء الاصطناعي وكيف يغير قواعد اللعبة في صناعة المحتوى...',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    author: { name: 'سارة أحمد', username: 'sara_tech', avatar: null },
    category: 'تقنية',
    readTime: 12,
    viewsCount: 2340,
    giftsCount: 78,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'أسرار النجاح في العمل الحر',
    excerpt: 'دليلك الشامل للبدء في العمل الحر وتحقيق الدخل من مهاراتك...',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    author: { name: 'محمد علي', username: 'mohamed_freelance', avatar: null },
    category: 'أعمال',
    readTime: 10,
    viewsCount: 1890,
    giftsCount: 56,
    createdAt: new Date(),
  },
];

const categories = [
  { name: 'إبداع', icon: '✨', count: 156 },
  { name: 'تقنية', icon: '💻', count: 234 },
  { name: 'أعمال', icon: '📈', count: 189 },
  { name: 'أسلوب حياة', icon: '🌟', count: 312 },
  { name: 'تعليم', icon: '📚', count: 278 },
  { name: 'ترفيه', icon: '🎭', count: 145 },
];

const topWriters = [
  { name: 'أحمد محمد', username: 'ahmed_writer', avatar: null, articles: 45, gifts: 1250 },
  { name: 'سارة أحمد', username: 'sara_tech', avatar: null, articles: 38, gifts: 980 },
  { name: 'محمد علي', username: 'mohamed_freelance', avatar: null, articles: 32, gifts: 856 },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    role: string;
    coinsBalance: number;
  } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // التحقق من وجود مستخدم مسجل (يدعم Supabase و JWT)
    const checkAuth = async () => {
      try {
        // أولاً: محاولة الحصول على المستخدم من Supabase
        const supabaseUser = await getCurrentUser();
        if (supabaseUser) {
          // جلب بيانات المستخدم من API
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            if (data.data?.user) {
              setUser(data.data.user);
              return;
            }
          }
        }
      } catch {
        // Supabase auth failed, continue with JWT
      }

      // ثانياً: محاولة الحصول من JWT/LocalStorage
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        try {
          const parsed = JSON.parse(userData);
          setUser(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    };

    checkAuth();

    // الاستماع لتغييرات المصادقة من Supabase
    const subscription = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // تسجيل الخروج من Supabase
      await signOut();
    } catch {
      // Ignore Supabase signout errors
    }
    // مسح البيانات المحلية
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="زايلو" 
                width={40} 
                height={40} 
                className="rounded-xl"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                زايلو
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن مقالات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-slate-100 border-0 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Coins Balance */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">
                      {user.coinsBalance?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </Button>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-violet-100 text-violet-700">
                            {user.name?.[0] || user.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline text-sm font-medium">
                          {user.name || user.username}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="w-4 h-4 ml-2" />
                          الملف الشخصي
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wallet" className="cursor-pointer">
                          <Wallet className="w-4 h-4 ml-2" />
                          المحفظة
                        </Link>
                      </DropdownMenuItem>
                      {(user.role === 'WRITER' || user.role === 'ADMIN') && (
                        <DropdownMenuItem asChild>
                          <Link href="/writer" className="cursor-pointer">
                            <PenTool className="w-4 h-4 ml-2" />
                            لوحة الكاتب
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user.role === 'ADMIN' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <TrendingUp className="w-4 h-4 ml-2" />
                            لوحة الإدارة
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        <X className="w-4 h-4 ml-2" />
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">تسجيل الدخول</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    asChild
                  >
                    <Link href="/auth/register">إنشاء حساب</Link>
                  </Button>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="py-4">
                    <div className="relative mb-4">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن مقالات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <nav className="space-y-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.name}
                          href={`/category/${cat.name}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100"
                        >
                          <span>
                            {cat.icon} {cat.name}
                          </span>
                          <Badge variant="secondary">{cat.count}</Badge>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              اكتشف عالم المعرفة
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            منصة اجتماعية للمقالات تجمع بين جودة المحتوى ونظام دعم مالي لحظي. اقرأ، تعلم، وادعم
            كتابك المفضلين.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              asChild
            >
              <Link href="/auth/register">ابدأ الآن مجاناً</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#featured">تصفح المقالات</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            <div className="p-4 bg-white rounded-2xl shadow-sm border">
              <div className="text-3xl font-bold text-violet-600">10K+</div>
              <div className="text-sm text-muted-foreground">مقال منشور</div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border">
              <div className="text-3xl font-bold text-indigo-600">5K+</div>
              <div className="text-sm text-muted-foreground">كاتب نشط</div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border">
              <div className="text-3xl font-bold text-purple-600">1M+</div>
              <div className="text-sm text-muted-foreground">قارئ شهرياً</div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border">
              <div className="text-3xl font-bold text-pink-600">$500K+</div>
              <div className="text-sm text-muted-foreground">أرباح الكتاب</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section id="featured" className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">المقالات المميزة</h2>
              <p className="text-muted-foreground mt-1">أفضل المقالات المختارة لك</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/articles" className="gap-2">
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${article.coverImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute top-3 right-3 bg-violet-600">
                      {article.category}
                    </Badge>
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white text-sm">
                      <Clock className="w-4 h-4" />
                      {article.readTime} دقائق
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-bold line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {article.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>
                  </CardContent>

                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={article.author.avatar || undefined} />
                          <AvatarFallback className="bg-violet-100 text-violet-700">
                            {article.author.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{article.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {article.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-4 h-4 text-amber-500" />
                          {article.giftsCount}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">تصفح حسب التصنيف</h2>
            <p className="text-muted-foreground mt-1">اكتشف مقالات في مجالات متنوعة</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={`/category/${category.name}`}>
                <Card className="hover:shadow-md transition-all hover:border-violet-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count} مقال</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Writers */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">أفضل الكتاب</h2>
            <p className="text-muted-foreground mt-1">الكتاب الأكثر تأثيراً هذا الشهر</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {topWriters.map((writer, index) => (
              <Card key={writer.username} className="text-center">
                <CardContent className="p-6">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      <AvatarImage src={writer.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xl">
                        {writer.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                            ? 'bg-slate-400'
                            : 'bg-amber-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{writer.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">@{writer.username}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div>
                      <span className="font-bold text-violet-600">{writer.articles}</span>
                      <span className="text-muted-foreground mr-1">مقال</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-600">{writer.gifts}</span>
                      <span className="text-muted-foreground mr-1">هدية</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    متابعة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">كيف تعمل المنصة؟</h2>
            <p className="text-muted-foreground mt-1">ثلاث خطوات بسيطة للبدء</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. أنشئ حسابك</h3>
              <p className="text-muted-foreground text-sm">
                سجل مجاناً واختر إن كنت تريد القراءة أو الكتابة
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. اقرأ وتعلم</h3>
              <p className="text-muted-foreground text-sm">
                اكتشف مقالات متنوعة من كتاب محترفين وهواة
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. ادعم الكتاب</h3>
              <p className="text-muted-foreground text-sm">
                أرسل هدايا رمزية لدعم كتابك المفضلين مباشرة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white overflow-hidden">
            <CardContent className="p-8 md:p-12 relative">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">هل أنت كاتب؟</h2>
                <p className="mb-6 opacity-90">
                  انضم إلى مجتمع الكتاب في زايلو وابدأ في نشر مقالاتك وكسب الدخل من محتواك
                  الإبداعي
                </p>
                <Button
                  size="lg"
                  className="bg-white text-violet-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/auth/register?role=writer">ابدأ الكتابة الآن</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="زايلو" 
                  width={40} 
                  height={40}
                  className="rounded-xl"
                />
                <span className="text-xl font-bold">زايلو</span>
              </div>
              <p className="text-slate-400 text-sm">
                منصة اجتماعية للمقالات تجمع بين جودة المحتوى ونظام دعم مالي لحظي.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    عن المنصة
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="hover:text-white transition-colors">
                    المقالات
                  </Link>
                </li>
                <li>
                  <Link href="/writers" className="hover:text-white transition-colors">
                    الكتاب
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    الأسعار
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">القانونية</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    الشروط والأحكام
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    سياسة الخصوصية
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white transition-colors">
                    سياسة الكوكيز
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    اتصل بنا
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    الدعم الفني
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    الأسئلة الشائعة
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} زايلو. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
