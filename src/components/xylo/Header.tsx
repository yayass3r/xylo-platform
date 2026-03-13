'use client';

import { useState } from 'react';
import {
  Home,
  FileText,
  Wallet,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
  Sparkles,
  DollarSign,
  PenTool,
  Bookmark,
  Music,
  Menu,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserWithWallet, Notification, formatNumber } from '@/lib/constants';

interface HeaderProps {
  user: UserWithWallet | null;
  notifications: Notification[];
  unreadCount: number;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onViewProfile: (userId: string) => void;
  onNavigate: (section: string) => void;
  activeSection: string;
  onMarkNotificationsRead: () => void;
}

export function Header({
  user,
  notifications,
  unreadCount,
  onLogin,
  onRegister,
  onLogout,
  onViewProfile,
  onNavigate,
  activeSection,
  onMarkNotificationsRead,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              زايلو
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={activeSection === 'home' ? 'secondary' : 'ghost'}
              onClick={() => onNavigate('home')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </Button>
            <Button
              variant={activeSection === 'trending' ? 'secondary' : 'ghost'}
              onClick={() => onNavigate('trending')}
              className="gap-2"
            >
              <Flame className="w-4 h-4" />
              الرائج
            </Button>
            <Button
              variant={activeSection === 'articles' ? 'secondary' : 'ghost'}
              onClick={() => onNavigate('articles')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              المقالات
            </Button>
            {user && (
              <>
                <Button
                  variant={activeSection === 'wallet' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('wallet')}
                  className="gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  المحفظة
                </Button>
                <Button
                  variant={activeSection === 'my-articles' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('my-articles')}
                  className="gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  مقالاتي
                </Button>
                <Button
                  variant={activeSection === 'bookmarks' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('bookmarks')}
                  className="gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  المحفوظات
                </Button>
              </>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Balance badges */}
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <Badge variant="outline" className="gap-1 bg-purple-50 border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    {formatNumber(user.wallet?.malcoinBalance || 0)} MAL
                  </Badge>
                  <Badge variant="outline" className="gap-1 bg-amber-50 border-amber-200">
                    <DollarSign className="w-3 h-3 text-amber-600" />
                    {formatNumber(user.wallet?.quscoinBalance || 0)} QUS
                  </Badge>
                </div>
                
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (unreadCount > 0) onMarkNotificationsRead();
                    }}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  
                  {showNotifications && (
                    <Card className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-hidden shadow-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">الإشعارات</CardTitle>
                      </CardHeader>
                      <ScrollArea className="h-72">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            لا توجد إشعارات
                          </div>
                        ) : (
                          <div className="divide-y">
                            {notifications.slice(0, 10).map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                  !notif.isRead ? 'bg-purple-50' : ''
                                }`}
                              >
                                <p className="font-medium text-sm">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </Card>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                          {user.displayName?.[0] || user.name?.[0] || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">{user.displayName || user.name || 'المستخدم'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
                      <User className="w-4 h-4 ml-2" />
                      الملف الشخصي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('wallet')}>
                      <Wallet className="w-4 h-4 ml-2" />
                      المحفظة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('my-articles')}>
                      <FileText className="w-4 h-4 ml-2" />
                      مقالاتي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('bookmarks')}>
                      <Bookmark className="w-4 h-4 ml-2" />
                      المحفوظات
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 ml-2" />
                      الإعدادات
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onLogin}>
                  <LogIn className="w-4 h-4 ml-2" />
                  تسجيل الدخول
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={onRegister}
                >
                  <UserPlus className="w-4 h-4 ml-2" />
                  إنشاء حساب
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              <Button
                variant={activeSection === 'home' ? 'secondary' : 'ghost'}
                onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                className="justify-start gap-2"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </Button>
              <Button
                variant={activeSection === 'trending' ? 'secondary' : 'ghost'}
                onClick={() => { onNavigate('trending'); setMobileMenuOpen(false); }}
                className="justify-start gap-2"
              >
                <Flame className="w-4 h-4" />
                الرائج
              </Button>
              <Button
                variant={activeSection === 'articles' ? 'secondary' : 'ghost'}
                onClick={() => { onNavigate('articles'); setMobileMenuOpen(false); }}
                className="justify-start gap-2"
              >
                <FileText className="w-4 h-4" />
                المقالات
              </Button>
              {user && (
                <>
                  <Button
                    variant={activeSection === 'wallet' ? 'secondary' : 'ghost'}
                    onClick={() => { onNavigate('wallet'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    المحفظة
                  </Button>
                  <Button
                    variant={activeSection === 'my-articles' ? 'secondary' : 'ghost'}
                    onClick={() => { onNavigate('my-articles'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <PenTool className="w-4 h-4" />
                    مقالاتي
                  </Button>
                  <Button
                    variant={activeSection === 'bookmarks' ? 'secondary' : 'ghost'}
                    onClick={() => { onNavigate('bookmarks'); setMobileMenuOpen(false); }}
                    className="justify-start gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    المحفوظات
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
