'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Loader2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserFollow {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  followedAt?: string;
}

interface ProfileInfo {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  followersCount: number;
  followingCount: number;
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [followers, setFollowers] = useState<UserFollow[]>([]);
  const [following, setFollowing] = useState<UserFollow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('followers');

  useEffect(() => {
    fetchData();

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب معلومات الملف الشخصي
      const profileRes = await fetch(`/api/users/${username}`);
      const profileData = await profileRes.json();

      if (!profileData.success) {
        router.push('/');
        return;
      }

      setProfile(profileData.data);

      // جلب المتابعين
      const followersRes = await fetch(`/api/follow?type=followers&userId=${profileData.data.id}`);
      const followersData = await followersRes.json();

      if (followersData.success) {
        setFollowers(followersData.data || []);
      }

      // جلب المتابعين
      const followingRes = await fetch(`/api/follow?type=following&userId=${profileData.data.id}`);
      const followingData = await followingRes.json();

      if (followingData.success) {
        setFollowing(followingData.data || []);
      }

      // جلب قائمة المتابعين للمستخدم الحالي
      const token = localStorage.getItem('token');
      if (token) {
        const myFollowingRes = await fetch('/api/follow?type=following', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myFollowingData = await myFollowingRes.json();

        if (myFollowingData.success) {
          setFollowingIds(myFollowingData.data.map((u: UserFollow) => u.id) || []);
        }
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.data.isFollowing) {
          setFollowingIds([...followingIds, targetUserId]);
        } else {
          setFollowingIds(followingIds.filter((id) => id !== targetUserId));
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="followers" className="gap-2">
              <Users className="w-4 h-4" />
              المتابعون ({profile.followersCount})
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <UserPlus className="w-4 h-4" />
              المتابَعون ({profile.followingCount})
            </TabsTrigger>
          </TabsList>

          {/* Followers Tab */}
          <TabsContent value="followers">
            {followers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا يوجد متابعون بعد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {followers.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/user/${user.username}`}>
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-lg">
                              {user.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <Link href={`/user/${user.username}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-bold hover:text-violet-600">{user.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {user.role === 'ADMIN' ? 'مسؤول' : user.role === 'WRITER' ? 'كاتب' : 'قارئ'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                        {currentUserId && currentUserId !== user.id && (
                          <Button
                            variant={followingIds.includes(user.id) ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleFollow(user.id)}
                            className={followingIds.includes(user.id) ? '' : 'bg-violet-600 hover:bg-violet-700'}
                          >
                            {followingIds.includes(user.id) ? (
                              <>
                                <Check className="w-4 h-4 ml-1" />
                                متابَع
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 ml-1" />
                                متابعة
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            {following.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا يوجد متابَعون بعد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {following.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/user/${user.username}`}>
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-lg">
                              {user.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <Link href={`/user/${user.username}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-bold hover:text-violet-600">{user.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {user.role === 'ADMIN' ? 'مسؤول' : user.role === 'WRITER' ? 'كاتب' : 'قارئ'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                        {currentUserId && currentUserId !== user.id && (
                          <Button
                            variant={followingIds.includes(user.id) ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleFollow(user.id)}
                            className={followingIds.includes(user.id) ? '' : 'bg-violet-600 hover:bg-violet-700'}
                          >
                            {followingIds.includes(user.id) ? (
                              <>
                                <Check className="w-4 h-4 ml-1" />
                                متابَع
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 ml-1" />
                                متابعة
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
