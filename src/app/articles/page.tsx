'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Loader2,
  Eye,
  Gift,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  _count?: {
    gifts: number;
  };
}

const categories = [
  { value: 'all', label: 'جميع التصنيفات' },
  { value: 'إبداع', label: 'إبداع' },
  { value: 'تقنية', label: 'تقنية' },
  { value: 'أعمال', label: 'أعمال' },
  { value: 'أسلوب حياة', label: 'أسلوب حياة' },
  { value: 'تعليم', label: 'تعليم' },
  { value: 'ترفيه', label: 'ترفيه' },
];

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'popular', label: 'الأكثر مشاهدة' },
  { value: 'gifted', label: 'الأكثر إهداءً' },
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, sortBy, page]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'PUBLISHED');
      params.append('page', page.toString());
      params.append('limit', '12');

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (sortBy === 'popular') {
        params.append('orderBy', 'viewsCount');
        params.append('order', 'desc');
      } else if (sortBy === 'gifted') {
        params.append('orderBy', 'giftsCount');
        params.append('order', 'desc');
      }

      const response = await fetch(`/api/articles?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch articles error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <BookOpen className="w-8 h-8 inline-block ml-2 text-violet-600" />
            المقالات
          </h1>
          <p className="text-muted-foreground">اكتشف مقالات متنوعة من كتاب متميزين</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مقالات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </form>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="الترتيب" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">لا توجد مقالات</p>
          </div>
        ) : (
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
                        <span className="text-sm font-medium">
                          {article.author.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {article.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="w-4 h-4 text-amber-500" />
                          {article._count?.gifts || 0}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
