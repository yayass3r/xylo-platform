'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Loader2,
  BookOpen,
  Gift,
  Star,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Writer {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  articlesCount: number;
  followersCount: number;
  totalGifts: number;
}

export default function WritersPage() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWriters();
  }, []);

  const fetchWriters = async () => {
    try {
      // البحث عن الكتاب
      const response = await fetch('/api/search?type=users&q=');
      const data = await response.json();

      if (data.success) {
        const writersList = data.data.users.filter(
          (user: Writer) => user.role === 'WRITER' || user.role === 'ADMIN'
        );
        setWriters(writersList);
        
        // ترتيب حسب عدد الهدايا
        const sorted = [...writersList].sort((a, b) => b.totalGifts - a.totalGifts);
        setTopWriters(sorted.slice(0, 10));
      }
    } catch (error) {
      console.error('Fetch writers error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWriters = writers.filter(
    (writer) =>
      writer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      writer.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <Users className="w-8 h-8 inline-block ml-2 text-violet-600" />
            الكتاب
          </h1>
          <p className="text-muted-foreground">اكتشف أفضل الكتاب على المنصة</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن كاتب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Tabs defaultValue="top" className="max-w-4xl mx-auto">
          <TabsList className="mb-6">
            <TabsTrigger value="top">أفضل الكتاب</TabsTrigger>
            <TabsTrigger value="all">جميع الكتاب</TabsTrigger>
          </TabsList>

          {/* Top Writers */}
          <TabsContent value="top">
            <div className="grid md:grid-cols-2 gap-4">
              {topWriters.map((writer, index) => (
                <Link key={writer.id} href={`/user/${writer.username}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-2 border-white shadow">
                            <AvatarImage src={writer.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xl">
                              {writer.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
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
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{writer.name}</h3>
                            {index < 3 && (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{writer.username}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4 text-violet-600" />
                              {writer.articlesCount} مقال
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-violet-600" />
                              {writer.followersCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gift className="w-4 h-4 text-amber-500" />
                              {writer.totalGifts}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          متابعة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* All Writers */}
          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWriters.map((writer) => (
                <Link key={writer.id} href={`/user/${writer.username}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-white shadow">
                        <AvatarImage src={writer.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-2xl">
                          {writer.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold">{writer.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">@{writer.username}</p>
                      {writer.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {writer.bio}
                        </p>
                      )}
                      <div className="flex justify-center gap-4 text-sm mb-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-violet-600" />
                          {writer.articlesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-violet-600" />
                          {writer.followersCount}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        متابعة
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredWriters.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد كتاب بهذا الاسم</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
