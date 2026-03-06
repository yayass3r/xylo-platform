'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Gift,
  Coins,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Settings,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// بيانات تجريبية
const mockStats = {
  totalArticles: 45,
  publishedArticles: 38,
  draftArticles: 5,
  pendingArticles: 2,
  totalViews: 125000,
  totalGifts: 1250,
  diamondsBalance: 8500,
  totalEarned: 15000,
  totalWithdrawn: 6500,
};

const mockArticles = [
  { id: '1', title: 'كيف تبدأ رحلتك في الكتابة', status: 'PUBLISHED', views: 12500, gifts: 45, date: new Date() },
  { id: '2', title: 'أسرار النجاح في العمل الحر', status: 'PUBLISHED', views: 8500, gifts: 32, date: new Date() },
  { id: '3', title: 'الذكاء الاصطناعي ومستقبل المحتوى', status: 'PENDING', views: 0, gifts: 0, date: new Date() },
  { id: '4', title: 'دليل المبتدئين في الاستثمار', status: 'DRAFT', views: 0, gifts: 0, date: new Date() },
];

export default function WriterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newArticleOpen, setNewArticleOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'WRITER' && parsedUser.role !== 'ADMIN') {
        router.push('/');
      } else {
        setUser(parsedUser);
      }
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
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
              <h1 className="text-lg font-medium">لوحة الكاتب</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  {mockStats.diamondsBalance.toLocaleString()} ألماس
                </span>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  الرئيسية
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="articles">المقالات</TabsTrigger>
            <TabsTrigger value="earnings">الأرباح</TabsTrigger>
            <TabsTrigger value="wallet">المحفظة</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المقالات المنشورة</p>
                        <p className="text-2xl font-bold">{mockStats.publishedArticles}</p>
                      </div>
                      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المشاهدات</p>
                        <p className="text-2xl font-bold">{mockStats.totalViews.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الهدايا المستلمة</p>
                        <p className="text-2xl font-bold">{mockStats.totalGifts}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الأرباح</p>
                        <p className="text-2xl font-bold">${(mockStats.totalEarned / 100).toFixed(2)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-20 flex-col gap-2 bg-gradient-to-r from-violet-600 to-indigo-600">
                          <Plus className="w-6 h-6" />
                          مقال جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>إنشاء مقال جديد</DialogTitle>
                          <DialogDescription>اكتب مقالك وشاركه مع القراء</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">العنوان</Label>
                            <Input id="title" placeholder="عنوان المقال" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">التصنيف</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر التصنيف" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="creative">إبداع</SelectItem>
                                <SelectItem value="tech">تقنية</SelectItem>
                                <SelectItem value="business">أعمال</SelectItem>
                                <SelectItem value="lifestyle">أسلوب حياة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="content">المحتوى</Label>
                            <Textarea id="content" placeholder="اكتب مقالك هنا..." rows={10} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setNewArticleOpen(false)}>
                              إلغاء
                            </Button>
                            <Button>حفظ كمسودة</Button>
                            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                              نشر
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/writer/analytics">
                        <BarChart3 className="w-6 h-6" />
                        الإحصائيات
                      </Link>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/wallet">
                        <Wallet className="w-6 h-6" />
                        السحب
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Articles */}
              <Card>
                <CardHeader>
                  <CardTitle>أحدث المقالات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المشاهدات</TableHead>
                        <TableHead>الهدايا</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockArticles.slice(0, 3).map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.title}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                article.status === 'PUBLISHED'
                                  ? 'bg-green-100 text-green-700'
                                  : article.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                              }
                            >
                              {article.status === 'PUBLISHED'
                                ? 'منشور'
                                : article.status === 'PENDING'
                                  ? 'قيد المراجعة'
                                  : 'مسودة'}
                            </Badge>
                          </TableCell>
                          <TableCell>{article.views.toLocaleString()}</TableCell>
                          <TableCell>{article.gifts}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>جميع المقالات</CardTitle>
                  <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600">
                        <Plus className="w-4 h-4" />
                        مقال جديد
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المشاهدات</TableHead>
                      <TableHead>الهدايا</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              article.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-700'
                                : article.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                            }
                          >
                            {article.status === 'PUBLISHED'
                              ? 'منشور'
                              : article.status === 'PENDING'
                                ? 'قيد المراجعة'
                                : 'مسودة'}
                          </Badge>
                        </TableCell>
                        <TableCell>{article.views.toLocaleString()}</TableCell>
                        <TableCell>{article.gifts}</TableCell>
                        <TableCell>{article.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الأرباح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">إجمالي الأرباح</span>
                    <span className="font-bold text-lg">${(mockStats.totalEarned / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">تم سحبه</span>
                    <span className="font-bold">${(mockStats.totalWithdrawn / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">الرصيد القابل للسحب</span>
                    <span className="font-bold text-green-600">${(mockStats.diamondsBalance / 100).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الهدايا المستلمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { icon: '❤️', name: 'قلب', count: 450, value: 3150 },
                      { icon: '⭐', name: 'نجمة', count: 180, value: 6300 },
                      { icon: '👑', name: 'تاج', count: 45, value: 3150 },
                    ].map((gift, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{gift.icon}</span>
                          <span>{gift.name}</span>
                          <span className="text-muted-foreground">×{gift.count}</span>
                        </div>
                        <span className="font-medium text-amber-600">{gift.value} ألماس</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>رصيدك</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold text-amber-600 mb-2">
                      {mockStats.diamondsBalance.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">ألماس</div>
                    <div className="text-2xl font-bold mt-4">
                      ${(mockStats.diamondsBalance / 100).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-sm">قيمة بالدولار</div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                    طلب سحب
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>سجل السحوبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { amount: 50, status: 'PAID', date: new Date('2024-01-15') },
                      { amount: 30, status: 'PAID', date: new Date('2024-01-01') },
                    ].map((w, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <div className="font-medium">${w.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {w.date.toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          تم
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
