'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  BookOpen,
  Users,
  Coins,
  Settings,
  Edit,
  Camera,
  Save,
  X,
  Loader2,
  Eye,
  Gift,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  status: string;
  isKycVerified: boolean;
  createdAt: string;
  wallet?: {
    coinsBalance: number;
    diamondsBalance: number;
  };
  _count?: {
    articles: number;
    followers: number;
    following: number;
  };
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  viewsCount: number;
  readTime: number;
  createdAt: string;
  status: string;
  _count?: {
    gifts: number;
  };
}

// Loading Skeleton Component
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 animate-pulse">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-64 bg-slate-200 rounded" />
                <div className="flex gap-6">
                  <div className="h-6 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-20 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!userData || !token) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (!parsedUser?.id) {
          router.push('/auth/login');
          return;
        }

        setUser(parsedUser);
        setEditForm({
          name: parsedUser?.name || '',
          username: parsedUser?.username || '',
          bio: parsedUser?.bio || '',
        });
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/auth/login');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data?.success && data?.user) {
        setUser(data.user);
        setEditForm({
          name: data.user?.name || '',
          username: data.user?.username || '',
          bio: data.user?.bio || '',
        });
        fetchUserArticles(data.user?.id, token);
      } else {
        setError(data?.message || 'فشل في تحميل البيانات');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch user articles
  const fetchUserArticles = async (userId: string | undefined, token: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/articles?authorId=${userId}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data?.success && Array.isArray(data?.data)) {
        setArticles(data.data);
      }
    } catch (err) {
      console.error('Fetch articles error:', err);
    }
  };

  // Load data after auth check
  useEffect(() => {
    if (!isAuthChecking && user) {
      fetchProfile();
    }
  }, [isAuthChecking, user, fetchProfile]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data?.success) {
        setUser((prev) => (prev ? { ...prev, ...editForm } : null));
        setIsEditing(false);

        // Update local storage
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userData) {
          const parsed = JSON.parse(userData);
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...editForm }));
        }
      } else {
        setError(data?.message || 'فشل في حفظ التغييرات');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setError('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setIsSaving(false);
    }
  };

  // Show skeleton during auth check
  if (isAuthChecking) {
    return <ProfileSkeleton />;
  }

  // Don't render if not authenticated
  if (!user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Actions */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => fetchProfile()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* Profile Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-3xl">
                        {user?.name?.[0] || user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 left-0 rounded-full w-8 h-8"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{user?.name || user?.username || 'مستخدم'}</h1>
                      {user?.isKycVerified && <Badge className="bg-green-500">موثق</Badge>}
                      <Badge variant="outline">
                        {user?.role === 'ADMIN' ? 'مسؤول' : user?.role === 'WRITER' ? 'كاتب' : 'قارئ'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">@{user?.username || 'user'}</p>
                    {user?.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                        <span className="font-bold">{user?._count?.articles ?? 0}</span>
                        <span className="text-muted-foreground">مقال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-600" />
                        <span className="font-bold">{user?._count?.followers ?? 0}</span>
                        <span className="text-muted-foreground">متابع</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-600" />
                        <span className="font-bold">{user?._count?.following ?? 0}</span>
                        <span className="text-muted-foreground">متابَع</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-violet-600" />
                        <span className="text-muted-foreground">
                          انضم{' '}
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('ar-SA')
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                        <Edit className="w-4 h-4" />
                        تعديل الملف الشخصي
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/settings" className="gap-2">
                          <Settings className="w-4 h-4" />
                          الإعدادات
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Wallet Balance */}
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-sm text-amber-700">رصيدك</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">
                        {user?.wallet?.coinsBalance?.toLocaleString() ?? 0}
                      </div>
                      <div className="text-sm text-amber-600">عملة</div>
                      {user?.role === 'WRITER' && (
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <div className="text-lg font-bold text-purple-600">
                            💎 {user?.wallet?.diamondsBalance?.toLocaleString() ?? 0}
                          </div>
                          <div className="text-xs text-purple-500">ألماس</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Dialog */}
            {isEditing && (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>تعديل الملف الشخصي</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">الاسم</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">اسم المستخدم</label>
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="username"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">نبذة عني</label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="اكتب نبذة عن نفسك..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  مقالاتي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">لم تقم بنشر أي مقالات بعد</p>
                    {(user?.role === 'WRITER' || user?.role === 'ADMIN') && (
                      <Button asChild>
                        <Link href="/writer">ابدأ الكتابة</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <Link key={article?.id || Math.random().toString()} href={`/article/${article?.id}`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {article?.coverImage && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={article.coverImage}
                                    alt={article?.title || 'مقال'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-bold mb-1">{article?.title || 'بدون عنوان'}</h3>
                                {article?.excerpt && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {article.excerpt}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {article?.category && (
                                    <Badge variant="secondary">{article.category}</Badge>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {article?.viewsCount ?? 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Gift className="w-4 h-4 text-amber-500" />
                                    {article?._count?.gifts ?? 0}
                                  </span>
                                  <Badge
                                    variant={
                                      article?.status === 'PUBLISHED'
                                        ? 'default'
                                        : article?.status === 'PENDING'
                                          ? 'secondary'
                                          : 'outline'
                                    }
                                  >
                                    {article?.status === 'PUBLISHED'
                                      ? 'منشور'
                                      : article?.status === 'PENDING'
                                        ? 'قيد المراجعة'
                                        : 'مسودة'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
