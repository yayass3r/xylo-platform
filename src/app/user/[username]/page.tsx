'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  BookOpen,
  Users,
  Calendar,
  Loader2,
  Eye,
  Gift,
  Check,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PublicProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  isKycVerified: boolean;
  joinedAt: string;
  stats: {
    articlesCount: number;
    followersCount: number;
    followingCount: number;
  };
  recentArticles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    category: string | null;
    viewsCount: number;
    readTime: number;
    createdAt: string;
    giftsCount: number;
  }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();

    // الحصول على المستخدم الحالي
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setCurrentUserId(parsed.id);
      } catch {
        // Ignore
      }
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        // التحقق من حالة المتابعة
        checkFollowStatus(data.data.id);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async (targetUserId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/follow?type=following`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const isFollowingUser = data.data.some(
          (follow: any) => follow.id === targetUserId
        );
        setIsFollowing(isFollowingUser);
      }
    } catch (error) {
      console.error('Check follow status error:', error);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setFollowLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: profile.id }),
      });

      const data = await response.json();
      if (data.success) {
        setIsFollowing(data.data.isFollowing);
        // تحديث العداد
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            followersCount: profile.stats.followersCount + (data.data.isFollowing ? 1 : -1),
          },
        });
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-3xl">
                    {profile.name?.[0] || profile.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
                  {profile.isKycVerified && (
                    <Badge className="bg-green-500">
                      <Check className="w-3 h-3 ml-1" />
                      موثق
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {profile.role === 'ADMIN' ? 'مسؤول' : profile.role === 'WRITER' ? 'كاتب' : 'قارئ'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <span className="font-bold">{profile.stats.articlesCount}</span>
                    <span className="text-muted-foreground">مقال</span>
                  </div>
                  <Link 
                    href={`/user/${profile.username}/followers?t=followers`}
                    className="flex items-center gap-2 hover:text-violet-600 transition-colors"
                  >
                    <Users className="w-5 h-5 text-violet-600" />
                    <span className="font-bold">{profile.stats.followersCount}</span>
                    <span className="text-muted-foreground">متابع</span>
                  </Link>
                  <Link 
                    href={`/user/${profile.username}/followers?t=following`}
                    className="flex items-center gap-2 hover:text-violet-600 transition-colors"
                  >
                    <Users className="w-5 h-5 text-violet-600" />
                    <span className="font-bold">{profile.stats.followingCount}</span>
                    <span className="text-muted-foreground">متابَع</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-600" />
                    <span className="text-muted-foreground">
                      انضم {new Date(profile.joinedAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!isOwnProfile && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                    className={isFollowing ? '' : 'bg-gradient-to-r from-violet-600 to-indigo-600'}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="w-4 h-4 ml-2" />
                        متابَع
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 ml-2" />
                        متابعة
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles */}
        <h2 className="text-xl font-bold mb-4">المقالات</h2>
        {profile.recentArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مقالات منشورة بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.recentArticles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Cover Image */}
                  {article.coverImage && (
                    <div className="relative h-48 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${article.coverImage})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {article.category && (
                        <Badge className="absolute top-3 right-3 bg-violet-600">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.viewsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-amber-500" />
                        {article.giftsCount}
                      </span>
                      <span className="mr-auto text-xs">
                        {new Date(article.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
