'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Eye,
  Gift,
  Coins,
  Heart,
  Share2,
  Bookmark,
  ChevronLeft,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
  Star,
  Crown,
  Rocket,
  PartyPoppper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// بيانات تجريبية للهدايا
const availableGifts = [
  { id: '1', name: 'Heart', nameAr: 'قلب', icon: '❤️', coinCost: 10, diamondValue: 7, animation: 'heart' },
  { id: '2', name: 'Star', nameAr: 'نجمة', icon: '⭐', coinCost: 50, diamondValue: 35, animation: 'star' },
  { id: '3', name: 'Crown', nameAr: 'تاج', icon: '👑', coinCost: 100, diamondValue: 70, animation: 'crown' },
  { id: '4', name: 'Rocket', nameAr: 'صاروخ', icon: '🚀', coinCost: 200, diamondValue: 140, animation: 'rocket' },
  { id: '5', name: 'Sparkles', nameAr: 'بريق', icon: '✨', coinCost: 500, diamondValue: 350, animation: 'sparkles' },
  { id: '6', name: 'Party', nameAr: 'احتفال', icon: '🎉', coinCost: 1000, diamondValue: 700, animation: 'party' },
];

// بيانات تجريبية للمقال
const mockArticle = {
  id: '1',
  title: 'كيف تبدأ رحلتك في الكتابة الإبداعية',
  slug: 'how-to-start-creative-writing',
  content: `
    <p>الكتابة الإبداعية هي فن يعتمد على الخيال والإبداع في صياغة النصوص بطريقة تجذب القارئ وتأسر اهتمامه. في هذا المقال، سنتعرف على أساسيات الكتابة الإبداعية وكيف يمكنك البدء في رحلتك ككاتب مبدع.</p>

    <h2>ما هي الكتابة الإبداعية؟</h2>
    <p>الكتابة الإبداعية هي شكل من أشكال التعبير الفني الذي يتجاوز الحدود التقليدية للكتابة. إنها ليست مجرد نقل للمعلومات، بل هي فن يدمج بين الخيال والعاطفة واللغة الجميلة لخلق نصوص تلامس قلوب القراء.</p>

    <h2>أساسيات الكتابة الإبداعية</h2>
    <p>للبدء في الكتابة الإبداعية، إليك بعض الأساسيات التي يجب عليك إتقانها:</p>
    <ul>
      <li><strong>القراءة المستمرة:</strong> القراءة هي الوقود الذي يغذي خيالك ويوسع آفاقك.</li>
      <li><strong>الكتابة اليومية:</strong> خصص وقتاً يومياً للكتابة حتى لو كانت بضع جمل فقط.</li>
      <li><strong>الملاحظة:</strong> راقب العالم من حولك واستلهم الأفكار من التفاصيل الصغيرة.</li>
      <li><strong>التدرب:</strong> لا تخف من التجربة والخطأ، فالكتابة مهارة تتحسن بالممارسة.</li>
    </ul>

    <h2>نصائح للمبتدئين</h2>
    <p>إذا كنت جديداً في عالم الكتابة الإبداعية، إليك بعض النصائح التي ستساعدك:</p>
    <ol>
      <li>ابدأ بكتابة ما تعرفه وأحبه.</li>
      <li>لا تسعى للكمال في المسودة الأولى.</li>
      <li>اقرأ لأدباء مشهورين وتعلم من أساليبهم.</li>
      <li>انضم لمجتمعات الكتابة وشارك أعمالك.</li>
      <li>تقبل النقد البناء واستفد منه.</li>
    </ol>

    <h2>الخاتمة</h2>
    <p>الكتابة الإبداعية رحلة ممتعة لا تنتهي. كلما كتبت أكثر، اكتشفت المزيد عن نفسك وعن قدراتك الإبداعية. ابدأ اليوم، وستفاجأ بما يمكنك تحقيقه.</p>
  `,
  excerpt: 'اكتشف أسرار الكتابة الإبداعية وكيف تطور مهاراتك في عالم الأدب...',
  coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200',
  category: 'إبداع',
  tags: ['كتابة', 'إبداع', 'تطوير ذات'],
  readTime: 8,
  viewsCount: 1250,
  createdAt: new Date('2024-01-15'),
  author: {
    id: 'author-1',
    name: 'أحمد محمد',
    username: 'ahmed_writer',
    avatar: null,
    bio: 'كاتب ومبدع شغوف بالأدب والقصص. أسعى لنشر المعرفة والإلهام من خلال كتاباتي.',
    articlesCount: 45,
    followersCount: 1250,
    giftsCount: 320,
  },
  gifts: [
    { id: 'g1', gift: availableGifts[0], sender: { name: 'محمد' }, createdAt: new Date() },
    { id: 'g2', gift: availableGifts[1], sender: { name: 'سارة' }, createdAt: new Date() },
  ],
  totalGifts: 45,
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(mockArticle);
  const [user, setUser] = useState<{ id: string; coinsBalance: number } | null>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [selectedGift, setSelectedGift] = useState<typeof availableGifts[0] | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showGiftAnimation, setShowGiftAnimation] = useState(false);
  const [animatedGift, setAnimatedGift] = useState<typeof availableGifts[0] | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // التحقق من المستخدم
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSendGift = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!selectedGift) {
      toast.error('يرجى اختيار هدية');
      return;
    }

    if (user.coinsBalance < selectedGift.coinCost) {
      toast.error('رصيدك غير كافٍ. يرجى شحن محفظتك.');
      return;
    }

    setSending(true);

    try {
      // محاكاة إرسال الهدية
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // عرض الأنيميشن
      setAnimatedGift(selectedGift);
      setShowGiftAnimation(true);
      setShowGiftDialog(false);

      // تحديث الرصيد
      setUser({
        ...user,
        coinsBalance: user.coinsBalance - selectedGift.coinCost,
      });

      toast.success(`تم إرسال ${selectedGift.nameAr} بنجاح! 🎁`);

      setTimeout(() => {
        setShowGiftAnimation(false);
        setAnimatedGift(null);
      }, 3000);
    } catch {
      toast.error('حدث خطأ أثناء إرسال الهدية');
    } finally {
      setSending(false);
      setSelectedGift(null);
      setGiftMessage('');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط!');
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Gift Animation Overlay */}
      {showGiftAnimation && animatedGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-bounce text-8xl">{animatedGift.icon}</div>
          <div className="absolute text-white text-2xl font-bold mt-32">
            تم إرسال {animatedGift.nameAr}! 💫
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                زايلو
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    {user.coinsBalance?.toLocaleString() || 0}
                  </span>
                </div>
              ) : (
                <Button asChild>
                  <Link href="/auth/login">تسجيل الدخول</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 md:h-96 bg-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${article.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Category & Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <Badge className="bg-violet-600 mb-3">{article.category}</Badge>
            <h1 className="text-2xl md:text-4xl font-bold mb-3">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime} دقائق قراءة
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewsCount.toLocaleString()} مشاهدة
              </div>
              <div className="flex items-center gap-1">
                <Gift className="w-4 h-4" />
                {article.totalGifts} هدية
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.createdAt).toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg max-w-none prose-headings:text-violet-900 prose-a:text-violet-600">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t">
              <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    أرسل هدية
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">اختر هدية لإرسالها 🎁</DialogTitle>
                    <DialogDescription className="text-center">
                      أرسل هدية لدعم الكاتب مباشرة
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-3 gap-3 my-4">
                    {availableGifts.map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() => setSelectedGift(gift)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedGift?.id === gift.id
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-slate-200 hover:border-violet-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{gift.icon}</div>
                        <div className="font-medium text-sm">{gift.nameAr}</div>
                        <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mt-1">
                          <Coins className="w-3 h-3" />
                          {gift.coinCost}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedGift && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span>الهدية:</span>
                        <span className="font-medium">
                          {selectedGift.icon} {selectedGift.nameAr}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>التكلفة:</span>
                        <span className="font-medium text-amber-600 flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          {selectedGift.coinCost} عملة
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSendGift}
                    disabled={!selectedGift || sending}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  >
                    {sending ? 'جاري الإرسال...' : 'إرسال الهدية'}
                  </Button>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="lg" className="gap-2" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
                مشاركة
              </Button>

              <Button
                variant="outline"
                size="lg"
                className={`gap-2 ${isBookmarked ? 'text-violet-600 border-violet-300' : ''}`}
                onClick={() => {
                  setIsBookmarked(!isBookmarked);
                  toast.success(isBookmarked ? 'تمت الإزالة من المحفوظات' : 'تم الحفظ!');
                }}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                حفظ
              </Button>
            </div>

            {/* Recent Gifts */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  الهدايا المرسلة ({article.totalGifts})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {article.gifts.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2">
                      <span className="text-xl">{g.gift.icon}</span>
                      <span className="text-sm font-medium">{g.sender.name}</span>
                    </div>
                  ))}
                  {article.totalGifts > article.gifts.length && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">+{article.totalGifts - article.gifts.length} المزيد</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-violet-100">
                    <AvatarImage src={article.author.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-2xl">
                      {article.author.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{article.author.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">@{article.author.username}</p>
                  <p className="text-sm text-muted-foreground mb-4">{article.author.bio}</p>

                  <div className="flex justify-center gap-4 text-sm mb-4">
                    <div>
                      <div className="font-bold text-violet-600">{article.author.articlesCount}</div>
                      <div className="text-muted-foreground">مقال</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-600">{article.author.giftsCount}</div>
                      <div className="text-muted-foreground">هدية</div>
                    </div>
                    <div>
                      <div className="font-bold text-indigo-600">{article.author.followersCount}</div>
                      <div className="text-muted-foreground">متابع</div>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                    متابعة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4">
                <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                  <Link href="/">
                    <ArrowRight className="w-4 h-4" />
                    العودة للرئيسية
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
