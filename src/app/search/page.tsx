'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  BookOpen,
  Users,
  Hash,
  Loader2,
  Eye,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchResult {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    category: string | null;
    viewsCount: number;
    author: {
      name: string | null;
      username: string | null;
      avatar: string | null;
    };
  }>;
  users: Array<{
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    bio: string | null;
    role: string;
    articlesCount: number;
    followersCount: number;
  }>;
  hashtags: Array<{
    id: string;
    name: string;
    nameAr: string | null;
    articlesCount: number;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const totalResults =
    (results?.articles?.length || 0) +
    (results?.users?.length || 0) +
    (results?.hashtags?.length || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-bold mb-4 text-center">البحث</h1>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مقالات، كتاب، هاشتاقات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 h-12 text-lg"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : results ? (
        <>
          <p className="text-muted-foreground mb-6 text-center">
            تم العثور على {totalResults} نتيجة لـ "{query}"
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="mb-6">
              <TabsTrigger value="all">الكل ({totalResults})</TabsTrigger>
              <TabsTrigger value="articles">
                المقالات ({results.articles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="users">
                المستخدمون ({results.users?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="hashtags">
                الهاشتاقات ({results.hashtags?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all">
              <div className="space-y-6">
                {/* Articles */}
                {results.articles && results.articles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-violet-600" />
                      المقالات
                    </h3>
                    <div className="grid gap-4">
                      {results.articles.slice(0, 3).map((article) => (
                        <Link key={article.id} href={`/article/${article.id}`}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {article.coverImage && (
                                  <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={article.coverImage}
                                      alt={article.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-bold mb-1">{article.title}</h4>
                                  {article.excerpt && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {article.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                    <span>{article.author.name}</span>
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      {article.viewsCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {results.users && results.users.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-violet-600" />
                      المستخدمون
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.users.slice(0, 4).map((user) => (
                        <Link key={user.id} href={`/user/${user.username}`}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={user.avatar || undefined} />
                                  <AvatarFallback className="bg-violet-100 text-violet-700">
                                    {user.name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {results.hashtags && results.hashtags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-violet-600" />
                      الهاشتاقات
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.map((hashtag) => (
                        <Link key={hashtag.id} href={`/hashtag/${hashtag.name}`}>
                          <Badge variant="secondary" className="px-4 py-2 text-sm">
                            #{hashtag.name}
                            <span className="mr-2 text-muted-foreground">
                              {hashtag.articlesCount} مقال
                            </span>
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Articles Only */}
            <TabsContent value="articles">
              <div className="grid gap-4">
                {results.articles?.map((article) => (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {article.coverImage && (
                            <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={article.coverImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold mb-1">{article.title}</h4>
                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span>{article.author.name}</span>
                              {article.category && (
                                <Badge variant="secondary">{article.category}</Badge>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {article.viewsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Users Only */}
            <TabsContent value="users">
              <div className="grid md:grid-cols-2 gap-4">
                {results.users?.map((user) => (
                  <Link key={user.id} href={`/user/${user.username}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xl">
                              {user.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{user.name}</p>
                              <Badge variant="outline">
                                {user.role === 'WRITER' ? 'كاتب' : 'قارئ'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {user.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{user.articlesCount} مقال</span>
                              <span>{user.followersCount} متابع</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Hashtags Only */}
            <TabsContent value="hashtags">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.hashtags?.map((hashtag) => (
                  <Link key={hashtag.id} href={`/hashtag/${hashtag.name}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Hash className="w-6 h-6 text-violet-600" />
                        </div>
                        <p className="font-bold">#{hashtag.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.articlesCount} مقال
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ابحث عن مقالات، كتاب، وهاشتاقات</p>
        </div>
      )}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <Suspense fallback={<SearchLoading />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
