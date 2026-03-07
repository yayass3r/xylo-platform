'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Gift,
  ChevronLeft,
  Menu,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Loader2,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Types
interface AdminStats {
  users: {
    total: number;
    writers: number;
    readers: number;
    active: number;
    banned: number;
    newThisMonth: number;
  };
  articles: {
    total: number;
    published: number;
    pending: number;
    draft: number;
    totalViews: number;
  };
  gifts: {
    total: number;
    totalDiamonds: number;
    totalCoins: number;
  };
  withdrawals: {
    pending: number;
    totalPaid: number;
  };
  transactions: {
    totalPurchased: number;
  };
  revenue: {
    total: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  avatar: string | null;
  role: string;
  status: string;
  articles: number;
  gifts: number;
}

interface Withdrawal {
  id: string;
  userId: string;
  user: { name: string | null; email: string };
  diamondAmount: number;
  usdValue: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل لوحة الإدارة...</p>
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton
function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Check auth - runs only on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser?.role !== 'ADMIN') {
          router.push('/');
          return;
        }

        setUser(parsedUser);
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/auth/login');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('يرجى تسجيل الدخول مرة أخرى');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData?.success && statsData?.data) {
          setStats(statsData.data);
        }
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData?.success && Array.isArray(usersData?.data)) {
          setUsers(usersData.data);
        }
      }

      // Fetch pending withdrawals
      const withdrawalsRes = await fetch('/api/admin/withdrawals?status=PENDING', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        if (withdrawalsData?.success && Array.isArray(withdrawalsData?.data)) {
          setWithdrawals(withdrawalsData.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isAuthChecking) {
      fetchData();
    }
  }, [user, isAuthChecking, fetchData]);

  // Approve withdrawal
  const handleApproveWithdrawal = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve withdrawal:', err);
    }
  };

  // Reject withdrawal
  const handleRejectWithdrawal = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to reject withdrawal:', err);
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  // Show loading skeleton during auth check
  if (isAuthChecking) {
    return <LoadingSkeleton />;
  }

  // Don't render if not authenticated
  if (!user) {
    return <LoadingSkeleton />;
  }

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'withdrawals', label: 'طلبات السحب', icon: DollarSign },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  الرئيسية
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <StatsCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">المستخدمين</p>
                          <p className="text-2xl font-bold">
                            {(stats?.users?.total ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            +{stats?.users?.newThisMonth ?? 0} هذا الشهر
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
                          <p className="text-2xl font-bold">
                            {(stats?.articles?.total ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            {stats?.articles?.pending ?? 0} قيد المراجعة
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
                          <p className="text-2xl font-bold">
                            {(stats?.gifts?.total ?? 0).toLocaleString()}
                          </p>
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
                          <p className="text-2xl font-bold">
                            ${(stats?.revenue?.total ?? 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Pending Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span>طلبات سحب معلقة</span>
                      </div>
                      <Badge className="bg-amber-600">{stats?.withdrawals?.pending ?? 0}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-violet-200 bg-violet-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-violet-600" />
                        <span>مقالات قيد المراجعة</span>
                      </div>
                      <Badge className="bg-violet-600">{stats?.articles?.pending ?? 0}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ban className="w-5 h-5 text-red-600" />
                        <span>مستخدمين محظورين</span>
                      </div>
                      <Badge className="bg-red-600">{stats?.users?.banned ?? 0}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    إحصائيات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span>إجمالي الكتاب</span>
                        <span className="font-bold">
                          {(stats?.users?.writers ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span>إجمالي القراء</span>
                        <span className="font-bold">
                          {(stats?.users?.readers ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span>المستخدمين النشطين</span>
                        <span className="font-bold text-green-600">
                          {(stats?.users?.active ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span>إجمالي المشاهدات</span>
                        <span className="font-bold">
                          {(stats?.articles?.totalViews ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span>إجمالي الألماس المرسل</span>
                        <span className="font-bold text-amber-600">
                          {(stats?.gifts?.totalDiamonds ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span>إجمالي السحوبات المدفوعة</span>
                        <span className="font-bold">
                          ${(stats?.withdrawals?.totalPaid ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <CardTitle>إدارة المستخدمين</CardTitle>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      placeholder="بحث..."
                      className="w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-32">
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا يوجد مستخدمين</div>
                ) : (
                  <div className="overflow-x-auto">
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
                        {filteredUsers.slice(0, 20).map((u) => (
                          <TableRow key={u?.id || Math.random()}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={u?.avatar || undefined} />
                                  <AvatarFallback>{u?.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{u?.name || u?.username || 'مستخدم'}</div>
                                  <div className="text-sm text-muted-foreground">{u?.email || '-'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u?.role === 'ADMIN'
                                    ? 'default'
                                    : u?.role === 'WRITER'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {u?.role === 'ADMIN' ? 'مسؤول' : u?.role === 'WRITER' ? 'كاتب' : 'مستخدم'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  u?.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : u?.status === 'SUSPENDED'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700'
                                }
                              >
                                {u?.status === 'ACTIVE' ? 'نشط' : u?.status === 'SUSPENDED' ? 'معلق' : 'محظور'}
                              </Badge>
                            </TableCell>
                            <TableCell>{u?.articles ?? 0}</TableCell>
                            <TableCell>{u?.gifts ?? 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/user/${u?.username || u?.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={u?.status === 'BANNED' ? 'text-green-600' : 'text-red-600'}
                                  onClick={() => handleToggleUserStatus(u?.id, u?.status)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات سحب معلقة
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المستخدم</TableHead>
                          <TableHead>الألماس</TableHead>
                          <TableHead>القيمة</TableHead>
                          <TableHead>صافي المبلغ</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w?.id || Math.random()}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{w?.user?.name || 'مستخدم'}</div>
                                <div className="text-sm text-muted-foreground">{w?.user?.email || '-'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{(w?.diamondAmount ?? 0).toLocaleString()}</TableCell>
                            <TableCell>${(w?.usdValue ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="font-bold text-green-600">
                              ${(w?.netAmount ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {w?.createdAt ? new Date(w.createdAt).toLocaleDateString('ar-SA') : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveWithdrawal(w?.id)}
                                >
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                  موافقة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectWithdrawal(w?.id)}
                                >
                                  <XCircle className="w-4 h-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
                    <span>عمولة المنصة على السحوبات</span>
                    <span className="font-bold text-violet-600">10%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>الحد الأدنى للسحب</span>
                    <span className="font-bold">100 ألماس ($1)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>سعر الألماس</span>
                    <span className="font-bold">100 ألماس = $1</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>قيمة الدولار الواحد</span>
                    <span className="font-bold">100 عملة</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات المنصة</CardTitle>
                  <CardDescription>ملخص عام عن المنصة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>إجمالي المشاهدات</span>
                    <span className="font-bold">
                      {(stats?.articles?.totalViews ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>إجمالي الهدايا المرسلة</span>
                    <span className="font-bold">{(stats?.gifts?.total ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span>إجمالي الألماس المتداول</span>
                    <span className="font-bold text-amber-600">
                      {(stats?.gifts?.totalDiamonds ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>إجمالي الإيرادات</span>
                    <span className="font-bold text-green-600">
                      ${(stats?.revenue?.total ?? 0).toFixed(2)}
                    </span>
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
