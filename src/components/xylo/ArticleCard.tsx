'use client';

import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Gift,
  Bookmark,
  Share2,
  Eye,
  Clock,
  MoreHorizontal,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArticleWithAuthor, formatNumber, formatDate } from '@/lib/constants';

interface ArticleCardProps {
  article: ArticleWithAuthor;
  isCompact?: boolean;
  onLike: (articleId: string) => void;
  onBookmark: (articleId: string) => void;
  onGift: (article: ArticleWithAuthor) => void;
  onOpen: (article: ArticleWithAuthor) => void;
  onShare: (article: ArticleWithAuthor) => void;
  onViewProfile: (userId: string) => void;
}

export function ArticleCard({
  article,
  isCompact = false,
  onLike,
  onBookmark,
  onGift,
  onOpen,
  onShare,
  onViewProfile,
}: ArticleCardProps) {
  // Hover state for future use (e.g., hover animations)
  const [, setIsHovered] = useState(false);

  const getCategoryBadge = (category?: string | null) => {
    const categories: Record<string, { name: string; color: string }> = {
      technology: { name: 'تقنية', color: 'bg-blue-100 text-blue-700' },
      business: { name: 'أعمال', color: 'bg-green-100 text-green-700' },
      lifestyle: { name: 'أسلوب حياة', color: 'bg-pink-100 text-pink-700' },
      education: { name: 'تعليم', color: 'bg-amber-100 text-amber-700' },
      entertainment: { name: 'ترفيه', color: 'bg-purple-100 text-purple-700' },
      health: { name: 'صحة', color: 'bg-red-100 text-red-700' },
      sports: { name: 'رياضة', color: 'bg-orange-100 text-orange-700' },
      travel: { name: 'سفر', color: 'bg-cyan-100 text-cyan-700' },
      food: { name: 'طعام', color: 'bg-yellow-100 text-yellow-700' },
      other: { name: 'أخرى', color: 'bg-gray-100 text-gray-700' },
    };
    
    if (!category) return null;
    const cat = categories[category] || categories.other;
    return (
      <Badge variant="outline" className={`${cat.color} text-xs`}>
        {cat.name}
      </Badge>
    );
  };

  if (isCompact) {
    return (
      <Card
        className="overflow-hidden hover:shadow-md transition-all cursor-pointer group"
        onClick={() => onOpen(article)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-4 p-4">
          {article.coverImage && (
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={article.author.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {article.author.displayName?.[0] || article.author.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600 truncate">
                  {article.author.displayName || article.author.name || 'مستخدم'}
                </span>
              </div>
              {getCategoryBadge(article.category)}
            </div>
            <h3 className="font-semibold mt-2 line-clamp-2">{article.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(article.views)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatNumber(article.likes)}
              </span>
              <span>{formatDate(article.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onOpen(article)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.isFeatured && (
            <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
              مميز
            </Badge>
          )}
          {article.isTrending && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white">
              رائج
            </Badge>
          )}
        </div>
      )}
      
      <CardContent className="p-5">
        {/* Author & Category */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(article.author.id);
            }}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={article.author.avatar ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                {article.author.displayName?.[0] || article.author.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                {article.author.displayName || article.author.name || 'مستخدم'}
                {article.author.isVerified && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                    موثق
                  </Badge>
                )}
              </p>
              <p className="text-xs text-gray-500">{formatDate(article.createdAt)}</p>
            </div>
          </div>
          {getCategoryBadge(article.category)}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {article.title}
        </h3>
        
        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        )}
        
        {/* Read Time */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{article.readTime || 5} دقائق قراءة</span>
        </div>
      </CardContent>
      
      <CardFooter className="px-5 py-3 border-t bg-gray-50/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${article.isLiked ? 'text-red-500' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onLike(article.id);
              }}
            >
              <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{formatNumber(article.likes)}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{formatNumber(article._count?.comments || 0)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${article.isBookmarked ? 'text-purple-500' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(article.id);
              }}
            >
              <Bookmark className={`w-4 h-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              onClick={(e) => {
                e.stopPropagation();
                onGift(article);
              }}
            >
              <Gift className="w-4 h-4" />
              <span className="text-xs">{formatNumber(article.giftCount)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare(article);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 ml-2" />
                  إبلاغ عن المحتوى
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
