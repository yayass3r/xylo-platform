'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Hash,
  BookOpen,
  Loader2,
  Eye,
  Gift,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  giftsCount: number;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
}

interface HashtagInfo {
  id: string;
  name: string;
  nameAr: string | null;
  articlesCount: number;
}

export default function HashtagPage() {
  const params = useParams();
  const hashtagName = decodeURIComponent(params.name as string);

  const [articles, setArticles] = useState<Article[]>([]);
  const [hashtag, setHashtag] = useState<HashtagInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHashtagArticles();
  }, [hashtagName, page]);

  const fetchHashtagArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/hashtags/${hashtagName}?page=${page}&limit=12`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data.articles || []);
        setHashtag(data.data.hashtag);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch hashtag articles error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Hashtag Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="w-10 h-10 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">#{hashtagName}</h1>
          {hashtag && (
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {hashtag.articlesCount} مقال
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                رائج
              </span>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">لا توجد مقالات بهذا الهاشتاق</p>
            <p className="text-sm text-muted-foreground mt-2">
              كن أول من يكتب مقالاً بهذا الهاشتاق!
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.id}`}>
                  <Card className="group h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden">
                      {article.coverImage ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                          style={{ backgroundImage: `url(${article.coverImage})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-indigo-100" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {article.category && (
                        <Badge className="absolute top-3 right-3 bg-violet-600">
                          {article.category}
                        </Badge>
                      )}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white text-sm">
                        <Clock className="w-4 h-4" />
                        {article.readTime} دقائق
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="border-t pt-4 px-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={article.author.avatar || undefined} />
                            <AvatarFallback className="bg-violet-100 text-violet-700">
                              {article.author.name?.[0] || 'U'}
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

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="min-w-32"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'تحميل المزيد'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
