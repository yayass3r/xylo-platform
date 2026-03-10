'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import {
  Home,
  FileText,
  Wallet,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  Search,
  Eye,
  Gift,
  Plus,
  ChevronDown,
  Music,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Send,
  X,
  Loader2,
  CheckCircle,
  DollarSign,
  ArrowUpDown,
  Menu,
  PenTool
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Types
interface User {
  id: string
  email: string
  name?: string
  displayName?: string
  avatar?: string
  role: 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'
  isVerified: boolean
  wallet?: {
    malcoinBalance: number
    quscoinBalance: number
    totalEarned: number
    totalWithdrawn: number
  }
}

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  category?: string
  views: number
  likes: number
  giftCount: number
  giftValue: number
  createdAt: string
  author: {
    id: string
    name?: string
    displayName?: string
    avatar?: string
    isVerified: boolean
  }
  _count?: {
    comments: number
  }
}

interface Gift {
  id: string
  name: string
  nameAr: string
  icon: string
  cost: number
}

interface Transaction {
  id: string
  type: 'RECHARGE' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'COMMISSION'
  amount: number
  currency: 'MALCOIN' | 'QUSCOIN'
  description?: string
  createdAt: string
}

// API Functions
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ')
  }
  return data
}

// Format number to Arabic
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Format date to Arabic
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Transaction type labels
const transactionTypeLabels: Record<string, string> = {
  RECHARGE: 'شحن رصيد',
  GIFT_SENT: 'هدية مرسلة',
  GIFT_RECEIVED: 'هدية مستلمة',
  WITHDRAWAL: 'سحب رصيد',
  REFERRAL_BONUS: 'مكافأة إحالة',
  COMMISSION: 'عمولة',
}

// Article categories
const categories = [
  { id: 'technology', name: 'تقنية' },
  { id: 'business', name: 'أعمال' },
  { id: 'lifestyle', name: 'أسلوب حياة' },
  { id: 'education', name: 'تعليم' },
  { id: 'entertainment', name: 'ترفيه' },
  { id: 'health', name: 'صحة' },
  { id: 'sports', name: 'رياضة' },
  { id: 'travel', name: 'سفر' },
  { id: 'food', name: 'طعام' },
  { id: 'other', name: 'أخرى' },
]

// Withdrawal methods
const withdrawalMethods = [
  { id: 'STRIPE', name: 'Stripe' },
  { id: 'PAYPAL', name: 'PayPal' },
  { id: 'MOYASAR', name: 'مياسر' },
  { id: 'STC_PAY', name: 'STC Pay' },
  { id: 'PAYONEER', name: 'Payoneer' },
  { id: 'SKRILL', name: 'Skrill' },
]

export default function XyloPlatform() {
  // State
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'home' | 'articles' | 'wallet' | 'my-articles'>('home')
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  
  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '', referralCode: '' })
  
  // Articles
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('latest')
  
  // Article modal
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  
  // Create article
  const [showCreateArticleModal, setShowCreateArticleModal] = useState(false)
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  })
  const [createArticleLoading, setCreateArticleLoading] = useState(false)
  
  // Gifts
  const [gifts, setGifts] = useState<Gift[]>([])
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  
  // Wallet
  const [walletData, setWalletData] = useState<{
    wallet: {
      malcoinBalance: number
      quscoinBalance: number
      totalEarned: number
      totalWithdrawn: number
      quscoinUSDValue: number
    }
    transactions: Transaction[]
  } | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  
  // Withdrawal
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: '',
    accountInfo: ''
  })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  
  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check auth on mount
  const checkAuth = useCallback(async () => {
    try {
      const data = await fetchAPI('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setArticlesLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategory) params.set('category', selectedCategory)
      params.set('sort', sortBy)
      
      const data = await fetchAPI(`/articles?${params.toString()}`)
      setArticles(data.articles)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setArticlesLoading(false)
    }
  }, [searchQuery, selectedCategory, sortBy])

  // Fetch gifts
  const fetchGifts = useCallback(async () => {
    try {
      const data = await fetchAPI('/gifts')
      setGifts(data.gifts)
    } catch (error) {
      console.error('Error fetching gifts:', error)
    }
  }, [])

  // Fetch wallet
  const fetchWallet = useCallback(async () => {
    if (!user) return
    setWalletLoading(true)
    try {
      const data = await fetchAPI('/wallet')
      setWalletData(data)
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setWalletLoading(false)
    }
  }, [user])

  // Effects
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    fetchGifts()
  }, [fetchGifts])

  useEffect(() => {
    if (activeSection === 'wallet' && user) {
      fetchWallet()
    }
  }, [activeSection, user, fetchWallet])

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })
      setUser(data.user)
      setShowLoginModal(false)
      setLoginForm({ email: '', password: '' })
      toast.success('مرحباً بك! تم تسجيل الدخول بنجاح')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
      })
      setUser(data.user)
      setShowRegisterModal(false)
      setRegisterForm({ email: '', password: '', name: '', referralCode: '' })
      toast.success('مرحباً بك في زايلو! تم إنشاء حسابك بنجاح')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' })
      setUser(null)
      setActiveSection('home')
      toast.success('تم تسجيل الخروج بنجاح')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    }
  }

  // Article handlers
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateArticleLoading(true)
    try {
      await fetchAPI('/articles', {
        method: 'POST',
        body: JSON.stringify(articleForm),
      })
      setShowCreateArticleModal(false)
      setArticleForm({ title: '', content: '', category: '', status: 'DRAFT' })
      toast.success(articleForm.status === 'PUBLISHED' ? 'تم نشر المقال بنجاح!' : 'تم حفظ المسودة بنجاح!')
      fetchArticles()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setCreateArticleLoading(false)
    }
  }

  // Gift handler
  const handleSendGift = async () => {
    if (!selectedGift || !selectedArticle) return
    setGiftLoading(true)
    try {
      await fetchAPI('/gifts', {
        method: 'POST',
        body: JSON.stringify({
          giftId: selectedGift.id,
          receiverId: selectedArticle.author.id,
          articleId: selectedArticle.id,
          message: giftMessage,
        }),
      })
      setShowGiftModal(false)
      setSelectedGift(null)
      setGiftMessage('')
      toast.success(`تم إرسال ${selectedGift.nameAr} بنجاح! 🎁`)
      fetchArticles()
      if (user) {
        checkAuth()
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setGiftLoading(false)
    }
  }

  // Withdrawal handler
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawalLoading(true)
    try {
      await fetchAPI('/wallet', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(withdrawalForm.amount),
          method: withdrawalForm.method,
          accountInfo: withdrawalForm.accountInfo,
        }),
      })
      setShowWithdrawalModal(false)
      setWithdrawalForm({ amount: '', method: '', accountInfo: '' })
      toast.success('تم تقديم طلب السحب بنجاح!')
      fetchWallet()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  // Open article detail
  const openArticleDetail = (article: Article) => {
    setSelectedArticle(article)
    setShowArticleModal(true)
  }

  // Open gift modal
  const openGiftModal = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setShowGiftModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection('home')}>
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
                onClick={() => setActiveSection('home')}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </Button>
              <Button
                variant={activeSection === 'articles' ? 'secondary' : 'ghost'}
                onClick={() => setActiveSection('articles')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                المقالات
              </Button>
              {user && (
                <>
                  <Button
                    variant={activeSection === 'wallet' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveSection('wallet')}
                    className="gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    المحفظة
                  </Button>
                  <Button
                    variant={activeSection === 'my-articles' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveSection('my-articles')}
                    className="gap-2"
                  >
                    <PenTool className="w-4 h-4" />
                    مقالاتي
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
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
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
                      <DropdownMenuItem onClick={() => setActiveSection('wallet')}>
                        <Wallet className="w-4 h-4 ml-2" />
                        المحفظة
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveSection('my-articles')}>
                        <FileText className="w-4 h-4 ml-2" />
                        مقالاتي
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 ml-2" />
                        الإعدادات
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 ml-2" />
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setShowLoginModal(true)}>
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل الدخول
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => { setActiveSection('home'); setMobileMenuOpen(false) }}
                  className="justify-start gap-2"
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Button>
                <Button
                  variant={activeSection === 'articles' ? 'secondary' : 'ghost'}
                  onClick={() => { setActiveSection('articles'); setMobileMenuOpen(false) }}
                  className="justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  المقالات
                </Button>
                {user && (
                  <>
                    <Button
                      variant={activeSection === 'wallet' ? 'secondary' : 'ghost'}
                      onClick={() => { setActiveSection('wallet'); setMobileMenuOpen(false) }}
                      className="justify-start gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      المحفظة
                    </Button>
                    <Button
                      variant={activeSection === 'my-articles' ? 'secondary' : 'ghost'}
                      onClick={() => { setActiveSection('my-articles'); setMobileMenuOpen(false) }}
                      className="justify-start gap-2"
                    >
                      <PenTool className="w-4 h-4" />
                      مقالاتي
                    </Button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home Section */}
        {activeSection === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                منصة صناع المحتوى العربية
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  شارك إبداعك
                </span>
                <br />
                <span className="text-gray-900">واكسب من محتواك</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                زايلو هي المنصة العربية الأولى التي تمكّنك من نشر مقالاتك وكسب المكافآت من القراء عبر نظام الهدايا الفريد
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      onClick={() => setShowCreateArticleModal(true)}
                    >
                      <Plus className="w-5 h-5 ml-2" />
                      مقال جديد
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setActiveSection('articles')}>
                      استكشف المقالات
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      onClick={() => setShowRegisterModal(true)}
                    >
                      <UserPlus className="w-5 h-5 ml-2" />
                      ابدأ الآن مجاناً
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setShowLoginModal(true)}>
                      لديك حساب؟ سجل دخولك
                    </Button>
                  </>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                    <PenTool className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>اكتب وانشر</CardTitle>
                  <CardDescription>
                    أنشئ مقالاتك بسهولة وشاركها مع جمهورك
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                    <Gift className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle>احصل على هدايا</CardTitle>
                  <CardDescription>
                    القراء يرسلون هدايا كرمز تقدير لمحتواك
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>اسحب أرباحك</CardTitle>
                  <CardDescription>
                    حول QUSCOIN إلى دولارات واسحبها بسهولة
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>

            {/* Latest Articles */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">أحدث المقالات</h2>
                <Button variant="ghost" onClick={() => setActiveSection('articles')}>
                  عرض الكل
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(0, 6).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => openArticleDetail(article)}
                  />
                ))}
              </div>
            </section>

            {/* Gifts Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">الهدايا المتاحة</h2>
                <Badge variant="outline" className="bg-purple-50">
                  {gifts.length} هدايا
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {gifts.map((gift) => (
                  <button
                    key={gift.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border hover:border-purple-300 hover:shadow-lg transition-all"
                  >
                    <span className="text-4xl">{gift.icon}</span>
                    <span className="text-sm font-medium">{gift.nameAr}</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatNumber(gift.cost)} MAL
                    </Badge>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Articles Section */}
        {activeSection === 'articles' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="ابحث في المقالات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">الأحدث</SelectItem>
                      <SelectItem value="popular">الأكثر مشاهدة</SelectItem>
                      <SelectItem value="mostLiked">الأكثر إعجاباً</SelectItem>
                      <SelectItem value="mostGifted">الأكثر هدايا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Articles Grid */}
            {articlesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل المقالات...</p>
              </div>
            ) : articles.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مقالات</h3>
                  <p className="text-gray-600">لم يتم العثور على مقالات مطابقة للبحث</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => openArticleDetail(article)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wallet Section */}
        {activeSection === 'wallet' && user && (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <CardHeader>
                  <CardDescription className="text-purple-100">رصيد MALCOIN</CardDescription>
                  <CardTitle className="text-3xl">
                    {formatNumber(walletData?.wallet.malcoinBalance || user.wallet?.malcoinBalance || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-100 text-sm">لإرسال الهدايا</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardHeader>
                  <CardDescription className="text-amber-100">رصيد QUSCOIN</CardDescription>
                  <CardTitle className="text-3xl">
                    {formatNumber(walletData?.wallet.quscoinBalance || user.wallet?.quscoinBalance || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-100 text-sm">
                    ≈ ${(walletData?.wallet.quscoinUSDValue || 0).toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardDescription className="text-gray-600">إجمالي الأرباح</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatNumber(walletData?.wallet.totalEarned || 0)} QUS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">منذ انضمامك</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardDescription className="text-gray-600">إجمالي المسحوب</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatNumber(walletData?.wallet.totalWithdrawn || 0)} QUS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">طلبات ناجحة</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => toast.info('قريباً: ميزة شحن الرصيد')}
              >
                <ArrowUpDown className="w-4 h-4 ml-2" />
                شحن رصيد
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWithdrawalModal(true)}
                disabled={(walletData?.wallet.quscoinBalance || 0) < 1000}
              >
                <DollarSign className="w-4 h-4 ml-2" />
                طلب سحب
              </Button>
            </div>

            {/* Transactions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>سجل المعاملات</CardTitle>
                <CardDescription>آخر 20 معاملة</CardDescription>
              </CardHeader>
              <CardContent>
                {walletLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                  </div>
                ) : walletData?.transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد معاملات بعد
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {walletData?.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              tx.type === 'GIFT_RECEIVED' || tx.type === 'RECHARGE' || tx.type === 'REFERRAL_BONUS' || tx.type === 'COMMISSION'
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            )}>
                              {tx.type === 'GIFT_SENT' && <Send className="w-5 h-5" />}
                              {tx.type === 'GIFT_RECEIVED' && <Gift className="w-5 h-5" />}
                              {tx.type === 'RECHARGE' && <Sparkles className="w-5 h-5" />}
                              {tx.type === 'WITHDRAWAL' && <DollarSign className="w-5 h-5" />}
                              {tx.type === 'REFERRAL_BONUS' && <User className="w-5 h-5" />}
                              {tx.type === 'COMMISSION' && <TrendingUp className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{transactionTypeLabels[tx.type]}</p>
                              <p className="text-sm text-gray-500">{tx.description}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className={cn(
                              "font-medium",
                              tx.type === 'GIFT_RECEIVED' || tx.type === 'RECHARGE' || tx.type === 'REFERRAL_BONUS' || tx.type === 'COMMISSION'
                                ? "text-green-600"
                                : "text-red-600"
                            )}>
                              {tx.type === 'GIFT_RECEIVED' || tx.type === 'RECHARGE' || tx.type === 'REFERRAL_BONUS' || tx.type === 'COMMISSION' ? '+' : '-'}
                              {formatNumber(tx.amount)} {tx.currency === 'MALCOIN' ? 'MAL' : 'QUS'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Articles Section */}
        {activeSection === 'my-articles' && user && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">مقالاتي</h2>
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => setShowCreateArticleModal(true)}
              >
                <Plus className="w-4 h-4 ml-2" />
                مقال جديد
              </Button>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ابدأ الكتابة</h3>
                <p className="text-gray-600 mb-4">أنشئ مقالك الأول وشاركه مع العالم</p>
                <Button onClick={() => setShowCreateArticleModal(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مقال جديد
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">تسجيل الدخول</DialogTitle>
            <DialogDescription>
              سجل دخولك للوصول إلى حسابك والميزات الكاملة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">البريد الإلكتروني</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="example@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">كلمة المرور</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={authLoading}>
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <LogIn className="w-4 h-4 ml-2" />}
                تسجيل الدخول
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowRegisterModal(true)
                }}
              >
                إنشاء حساب جديد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">إنشاء حساب جديد</DialogTitle>
            <DialogDescription>
              انضم إلى زايلو وابدأ رحلتك الإبداعية
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">الاسم</Label>
              <Input
                id="register-name"
                type="text"
                placeholder="اسمك الكامل"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">البريد الإلكتروني</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="example@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">كلمة المرور</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-referral">رمز الإحالة (اختياري)</Label>
              <Input
                id="register-referral"
                type="text"
                placeholder="XXXXXX"
                value={registerForm.referralCode}
                onChange={(e) => setRegisterForm({ ...registerForm, referralCode: e.target.value })}
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={authLoading}>
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                إنشاء الحساب
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowRegisterModal(false)
                  setShowLoginModal(true)
                }}
              >
                لديك حساب؟ سجل دخولك
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Article Detail Modal */}
      <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedArticle.author.displayName || selectedArticle.author.name || 'مستخدم'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedArticle.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatNumber(selectedArticle.views)}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {selectedArticle.coverImage && (
                    <img
                      src={selectedArticle.coverImage}
                      alt={selectedArticle.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedArticle.content}
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="flex-wrap gap-2 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Heart className="w-3 h-3" />
                    {selectedArticle.likes}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {selectedArticle._count?.comments || 0}
                  </Badge>
                  <Badge variant="outline" className="gap-1 bg-amber-50 border-amber-200">
                    <Gift className="w-3 h-3" />
                    {selectedArticle.giftCount} هدية
                  </Badge>
                </div>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mr-auto"
                  onClick={openGiftModal}
                >
                  <Gift className="w-4 h-4 ml-2" />
                  أرسل هدية
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Article Modal */}
      <Dialog open={showCreateArticleModal} onOpenChange={setShowCreateArticleModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">إنشاء مقال جديد</DialogTitle>
            <DialogDescription>
              شارك أفكارك مع العالم
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateArticle} className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="space-y-2">
              <Label htmlFor="article-title">عنوان المقال</Label>
              <Input
                id="article-title"
                type="text"
                placeholder="عنوان جذاب لمقالك..."
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-category">التصنيف</Label>
              <Select
                value={articleForm.category}
                onValueChange={(value) => setArticleForm({ ...articleForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              <Label htmlFor="article-content">المحتوى</Label>
              <Textarea
                id="article-content"
                placeholder="اكتب محتوى مقالك هنا..."
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                className="min-h-[200px] h-full"
                required
              />
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={createArticleLoading}
                onClick={() => setArticleForm({ ...articleForm, status: 'DRAFT' })}
              >
                {createArticleLoading && articleForm.status === 'DRAFT' && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                حفظ كمسودة
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={createArticleLoading}
                onClick={() => setArticleForm({ ...articleForm, status: 'PUBLISHED' })}
              >
                {createArticleLoading && articleForm.status === 'PUBLISHED' && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                <CheckCircle className="w-4 h-4 ml-2" />
                نشر المقال
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gift Modal */}
      <Dialog open={showGiftModal} onOpenChange={setShowGiftModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">اختر هدية</DialogTitle>
            <DialogDescription>
              أرسل هدية كرمز تقدير للمحتوى
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    selectedGift?.id === gift.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <span className="text-2xl">{gift.icon}</span>
                  <span className="text-xs font-medium">{gift.nameAr}</span>
                  <span className="text-xs text-gray-500">{formatNumber(gift.cost)} MAL</span>
                </button>
              ))}
            </div>
            {selectedGift && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gift-message">رسالة (اختياري)</Label>
                  <Input
                    id="gift-message"
                    placeholder="شكراً على المحتوى الرائع!"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">التكلفة:</span>
                    <span className="font-medium">{formatNumber(selectedGift.cost)} MALCOIN</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600">رصيدك الحالي:</span>
                    <span className="font-medium">{formatNumber(user?.wallet?.malcoinBalance || 0)} MALCOIN</span>
                  </div>
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={handleSendGift}
                disabled={!selectedGift || giftLoading || (user?.wallet?.malcoinBalance || 0) < (selectedGift?.cost || 0)}
              >
                {giftLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Gift className="w-4 h-4 ml-2" />
                )}
                إرسال الهدية
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">طلب سحب رصيد</DialogTitle>
            <DialogDescription>
              الحد الأدنى للسحب: 1,000 QUSCOIN (${(1000 / 500).toFixed(2)})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                رصيدك الحالي: {formatNumber(walletData?.wallet.quscoinBalance || 0)} QUS
                (${(walletData?.wallet.quscoinUSDValue || 0).toFixed(2)} USD)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">الكمية (QUSCOIN)</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="1000"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                min={1000}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-method">طريقة السحب</Label>
              <Select
                value={withdrawalForm.method}
                onValueChange={(value) => setWithdrawalForm({ ...withdrawalForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  {withdrawalMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-account">معلومات الحساب</Label>
              <Input
                id="withdrawal-account"
                type="text"
                placeholder="البريد الإلكتروني أو رقم الحساب"
                value={withdrawalForm.accountInfo}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountInfo: e.target.value })}
                required
              />
            </div>
            {withdrawalForm.amount && parseFloat(withdrawalForm.amount) >= 1000 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">
                  ستستلم: ${(parseFloat(withdrawalForm.amount) / 500).toFixed(2)} USD
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                disabled={withdrawalLoading}
              >
                {withdrawalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <DollarSign className="w-4 h-4 ml-2" />
                )}
                تقديم الطلب
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">زايلو</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} زايلو. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Article Card Component
function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <Card
      className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      {article.coverImage ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
          <FileText className="w-12 h-12 text-purple-300" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
          {article.category && (
            <Badge variant="secondary" className="shrink-0">
              {categories.find(c => c.id === article.category)?.name || article.category}
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={article.author.avatar} />
            <AvatarFallback className="text-xs">
              {article.author.displayName?.[0] || article.author.name?.[0] || '؟'}
            </AvatarFallback>
          </Avatar>
          <span>{article.author.displayName || article.author.name || 'مستخدم'}</span>
          {article.author.isVerified && (
            <CheckCircle className="w-4 h-4 text-blue-500" />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2">
          {article.excerpt || article.content.substring(0, 150)}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatNumber(article.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {formatNumber(article.likes)}
          </span>
          <span className="flex items-center gap-1">
            <Gift className="w-4 h-4" />
            {article.giftCount}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
