'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Gift,
  Coins,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  BarChart3,
  Wallet,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface WriterStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  pendingArticles: number;
  totalViews: number;
  totalGifts: number;
  diamondsBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  viewsCount: number;
  category: string | null;
  coverImage: string | null;
  createdAt: string;
  gifts: { count: number }[];
}

interface Withdrawal {
  id: string;
  diamondAmount: number;
  usdValue: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
}

// Tiptap Editor Component
function TiptapEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'ابدأ بكتابة مقالك هنا...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[300px] focus:outline-none p-4',
        dir: 'rtl',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-slate-50 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-slate-200' : ''}
        >
          <strong>ب</strong>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-slate-200' : ''}
        >
          <em>م</em>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-slate-200' : ''}
        >
          <u>ت</u>
        </Button>
        <div className="w-px bg-slate-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}
        >
          عنوان
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
        >
          • قائمة
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-slate-200' : ''}
        >
          " اقتباس
        </Button>
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

export default function WriterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; role: string; name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newArticleOpen, setNewArticleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // New article form
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCoverImage, setArticleCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check auth
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'WRITER' && parsedUser.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      setUser(parsedUser);
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Fetch stats
      const statsRes = await fetch('/api/writer/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      // Fetch articles
      const articlesRes = await fetch('/api/writer/articles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        if (articlesData.success) setArticles(articlesData.data);
      }

      // Fetch withdrawals
      const withdrawalsRes = await fetch('/api/writer/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        if (withdrawalsData.success) setWithdrawals(withdrawalsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Handle cover image upload
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setArticleCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit article
  const handleSubmitArticle = async (publish: boolean) => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      setError('العنوان والمحتوى مطلوبان');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: articleTitle,
          content: articleContent,
          category: articleCategory,
          coverImage: articleCoverImage,
          status: publish ? 'PENDING' : 'DRAFT',
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess(publish ? 'تم إرسال المقال للمراجعة' : 'تم حفظ المقال كمسودة');
        setArticleTitle('');
        setArticleContent('');
        setArticleCategory('');
        setArticleCoverImage('');
        setCoverImageFile(null);
        fetchData();
        setTimeout(() => {
          setNewArticleOpen(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (err) {
      setError('حدث خطأ أثناء حفظ المقال');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      PUBLISHED: { label: 'منشور', class: 'bg-green-100 text-green-700' },
      PENDING: { label: 'قيد المراجعة', class: 'bg-amber-100 text-amber-700' },
      DRAFT: { label: 'مسودة', class: 'bg-slate-100 text-slate-700' },
      REJECTED: { label: 'مرفوض', class: 'bg-red-100 text-red-700' },
      PAID: { label: 'تم', class: 'bg-green-100 text-green-700' },
      APPROVED: { label: 'معتمد', class: 'bg-blue-100 text-blue-700' },
    };
    const { label, class: className } = config[status] || { label: status, class: '' };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  زايلو
                </span>
              </Link>
              <span className="text-slate-400">|</span>
              <h1 className="text-lg font-medium">لوحة الكاتب</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  {(stats?.diamondsBalance || 0).toLocaleString()} ألماس
                </span>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  الرئيسية
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="articles">المقالات</TabsTrigger>
            <TabsTrigger value="earnings">الأرباح</TabsTrigger>
            <TabsTrigger value="wallet">المحفظة</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المقالات المنشورة</p>
                        <p className="text-2xl font-bold">{stats?.publishedArticles || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المشاهدات</p>
                        <p className="text-2xl font-bold">{(stats?.totalViews || 0).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الهدايا المستلمة</p>
                        <p className="text-2xl font-bold">{stats?.totalGifts || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الأرباح</p>
                        <p className="text-2xl font-bold">${((stats?.totalEarned || 0) / 100).toFixed(2)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => setNewArticleOpen(true)}
                      className="h-20 flex-col gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                    >
                      <Plus className="w-6 h-6" />
                      مقال جديد
                    </Button>

                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/writer">
                        <BarChart3 className="w-6 h-6" />
                        الإحصائيات
                      </Link>
                    </Button>

                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/wallet">
                        <Wallet className="w-6 h-6" />
                        السحب
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Articles */}
              <Card>
                <CardHeader>
                  <CardTitle>أحدث المقالات</CardTitle>
                </CardHeader>
                <CardContent>
                  {articles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لم تكتب أي مقالات بعد
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>العنوان</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>المشاهدات</TableHead>
                          <TableHead>الهدايا</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.slice(0, 5).map((article) => (
                          <TableRow key={article.id}>
                            <TableCell className="font-medium">{article.title}</TableCell>
                            <TableCell>{statusBadge(article.status)}</TableCell>
                            <TableCell>{article.viewsCount.toLocaleString()}</TableCell>
                            <TableCell>{article.gifts?.length || 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/article/${article.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/writer/edit/${article.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>جميع المقالات</CardTitle>
                  <Button onClick={() => setNewArticleOpen(true)} className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600">
                    <Plus className="w-4 h-4" />
                    مقال جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    لم تكتب أي مقالات بعد. اضغط على "مقال جديد" للبدء.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العنوان</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المشاهدات</TableHead>
                        <TableHead>الهدايا</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.title}</TableCell>
                          <TableCell>{statusBadge(article.status)}</TableCell>
                          <TableCell>{article.viewsCount.toLocaleString()}</TableCell>
                          <TableCell>{article.gifts?.length || 0}</TableCell>
                          <TableCell>{new Date(article.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/article/${article.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/writer/edit/${article.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-600"
                                onClick={() => handleDeleteArticle(article.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الأرباح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">إجمالي الأرباح</span>
                    <span className="font-bold text-lg">${((stats?.totalEarned || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">تم سحبه</span>
                    <span className="font-bold">${((stats?.totalWithdrawn || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">الرصيد القابل للسحب</span>
                    <span className="font-bold text-green-600">${((stats?.diamondsBalance || 0) / 100).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الهدايا المستلمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                    <p>تم استلام {stats?.totalGifts || 0} هدية</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>رصيدك</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold text-amber-600 mb-2">
                      {(stats?.diamondsBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">ألماس</div>
                    <div className="text-2xl font-bold mt-4">
                      ${((stats?.diamondsBalance || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-sm">قيمة بالدولار</div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600" asChild>
                    <Link href="/wallet/withdraw">طلب سحب</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>سجل السحوبات</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات سحب بعد
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((w) => (
                        <div key={w.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div>
                            <div className="font-medium">${w.usdValue.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(w.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                          {statusBadge(w.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Article Dialog */}
      <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء مقال جديد</DialogTitle>
            <DialogDescription>اكتب مقالك وشاركه مع القراء</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input 
                id="title" 
                placeholder="عنوان المقال" 
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <Select value={articleCategory} onValueChange={setArticleCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creative">إبداع</SelectItem>
                  <SelectItem value="tech">تقنية</SelectItem>
                  <SelectItem value="business">أعمال</SelectItem>
                  <SelectItem value="lifestyle">أسلوب حياة</SelectItem>
                  <SelectItem value="education">تعليم</SelectItem>
                  <SelectItem value="entertainment">ترفيه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>صورة الغلاف</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {articleCoverImage ? (
                  <div className="relative">
                    <img 
                      src={articleCoverImage} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 left-2"
                      onClick={() => {
                        setArticleCoverImage('');
                        setCoverImageFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">اضغط لرفع صورة الغلاف</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>المحتوى *</Label>
              <TiptapEditor 
                content={articleContent} 
                onChange={setArticleContent} 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewArticleOpen(false);
                  setArticleTitle('');
                  setArticleContent('');
                  setArticleCategory('');
                  setArticleCoverImage('');
                  setError('');
                }}
              >
                إلغاء
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleSubmitArticle(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ كمسودة
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => handleSubmitArticle(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                إرسال للمراجعة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
