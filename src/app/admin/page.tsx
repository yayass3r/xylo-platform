'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Ban,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// بيانات تجريبية
const mockStats = {
  totalUsers: 12450,
  newUsersToday: 156,
  activeWriters: 892,
  totalArticles: 34560,
  publishedArticles: 28450,
  pendingArticles: 234,
  totalViews: 1250000,
  totalGifts: 45670,
  totalRevenue: 125000,
  pendingWithdrawals: 45,
  pendingKyc: 23,
  pendingReports: 12,
};

const mockUsers = [
  { id: '1', name: 'أحمد محمد', email: 'ahmed@email.com', role: 'WRITER', status: 'ACTIVE', articles: 45, gifts: 1250 },
  { id: '2', name: 'سارة أحمد', email: 'sara@email.com', role: 'USER', status: 'ACTIVE', articles: 0, gifts: 0 },
  { id: '3', name: 'محمد علي', email: 'mohamed@email.com', role: 'WRITER', status: 'SUSPENDED', articles: 32, gifts: 856 },
];

const mockWithdrawals = [
  { id: '1', user: 'أحمد محمد', amount: 500, status: 'PENDING', date: new Date() },
  { id: '2', user: 'سارة أحمد', amount: 1200, status: 'PENDING', date: new Date() },
];

const mockReports = [
  { id: '1', reporter: 'محمد', reported: 'سارة', reason: 'محتوى غير لائق', status: 'PENDING' },
  { id: '2', reporter: 'أحمد', reported: 'خالد', reason: 'انتحال شخصية', status: 'REVIEWING' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN') {
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

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'articles', label: 'المقالات', icon: FileText },
    { id: 'withdrawals', label: 'طلبات السحب', icon: DollarSign },
    { id: 'kyc', label: 'التحقق KYC', icon: CheckCircle },
    { id: 'reports', label: 'البلاغات', icon: AlertTriangle },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-white border-l shadow-lg transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                زايلو
              </span>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-violet-100 text-violet-700'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-4 left-4 p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          <Menu className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-20'}`}>
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
            <Button variant="ghost" asChild>
              <Link href="/" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                الرئيسية
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المستخدمين</p>
                        <p className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">
                          +{mockStats.newUsersToday} اليوم
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المقالات</p>
                        <p className="text-2xl font-bold">{mockStats.totalArticles.toLocaleString()}</p>
                        <p className="text-xs text-amber-600 mt-1">
                          {mockStats.pendingArticles} قيد المراجعة
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الهدايا</p>
                        <p className="text-2xl font-bold">{mockStats.totalGifts.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">إجمالي الهدايا</p>
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
                        <p className="text-sm text-muted-foreground">الإيرادات</p>
                        <p className="text-2xl font-bold">${mockStats.totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span>طلبات سحب معلقة</span>
                      </div>
                      <Badge className="bg-amber-600">{mockStats.pendingWithdrawals}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span>طلبات KYC معلقة</span>
                      </div>
                      <Badge className="bg-blue-600">{mockStats.pendingKyc}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span>بلاغات معلقة</span>
                      </div>
                      <Badge className="bg-red-600">{mockStats.pendingReports}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    النشاط الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'مستخدم جديد', user: 'خالد محمد', time: 'منذ 5 دقائق' },
                      { action: 'مقال جديد', user: 'أحمد علي', time: 'منذ 15 دقيقة' },
                      { action: 'طلب سحب', user: 'سارة أحمد', time: 'منذ 30 دقيقة' },
                      { action: 'بلاغ جديد', user: 'محمد خالد', time: 'منذ ساعة' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-violet-600 rounded-full" />
                          <span>{item.action}</span>
                          <span className="text-muted-foreground">- {item.user}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>إدارة المستخدمين</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input placeholder="بحث..." className="w-64" />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="USER">مستخدم</SelectItem>
                        <SelectItem value="WRITER">كاتب</SelectItem>
                        <SelectItem value="ADMIN">مسؤول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المقالات</TableHead>
                      <TableHead>الهدايا</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === 'ADMIN'
                                ? 'default'
                                : u.role === 'WRITER'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {u.role === 'ADMIN' ? 'مسؤول' : u.role === 'WRITER' ? 'كاتب' : 'مستخدم'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              u.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : u.status === 'SUSPENDED'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }
                          >
                            {u.status === 'ACTIVE' ? 'نشط' : u.status === 'SUSPENDED' ? 'معلق' : 'محظور'}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.articles}</TableCell>
                        <TableCell>{u.gifts}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <Card>
              <CardHeader>
                <CardTitle>طلبات السحب المعلقة</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockWithdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{w.user}</TableCell>
                        <TableCell>${w.amount}</TableCell>
                        <TableCell>{w.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-700">معلق</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 ml-1" />
                              موافقة
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="w-4 h-4 ml-1" />
                              رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle>البلاغات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المُبلِّغ</TableHead>
                      <TableHead>المُبلَّغ عنه</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.reporter}</TableCell>
                        <TableCell>{r.reported}</TableCell>
                        <TableCell>{r.reason}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {r.status === 'PENDING' ? 'معلق' : 'قيد المراجعة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            مراجعة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المنصة</CardTitle>
                  <CardDescription>تحكم في إعدادات المنصة الأساسية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>عمولة المنصة</span>
                    <span className="font-bold text-violet-600">30%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>الحد الأدنى للسحب</span>
                    <span className="font-bold">1000 ألماس</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>سعر الألماس</span>
                    <span className="font-bold">100 ألماس = $1</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>مراجعة المقالات تلقائياً</span>
                    <Badge variant="secondary">معطّل</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إدارة الهدايا</CardTitle>
                  <CardDescription>تعديل أسعار وقيم الهدايا</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['❤️ قلب', '⭐ نجمة', '👑 تاج', '🚀 صاروخ'].map((gift, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span>{gift}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">التكلفة:</span>
                          <span className="font-medium">{[10, 50, 100, 200][i]} عملة</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
