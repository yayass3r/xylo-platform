import { z } from 'zod';

// Auth validations
export const registerSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
});

// Article validations
export const createArticleSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(200, 'العنوان طويل جداً'),
  content: z.string().min(50, 'المحتوى يجب أن يكون 50 حرف على الأقل'),
  excerpt: z.string().max(300, 'المقتطف طويل جداً').optional(),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, 'التصنيف مطلوب'),
  isPaid: z.boolean().optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(50).optional(),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
  category: z.string().min(1).optional(),
  isPaid: z.boolean().optional(),
});

// Gift validations
export const sendGiftSchema = z.object({
  giftId: z.string().min(1, 'الهدية مطلوبة'),
  receiverId: z.string().min(1, 'المستلم مطلوب'),
  articleId: z.string().optional(),
  message: z.string().max(200, 'الرسالة طويلة جداً').optional(),
});

// Wallet validations
export const purchaseCoinsSchema = z.object({
  packageId: z.string().min(1, 'الباقة مطلوبة'),
  paymentMethod: z.string().min(1, 'طريقة الدفع مطلوبة'),
});

export const withdrawSchema = z.object({
  amount: z.number().min(100, 'الحد الأدنى للسحب هو 100 جوهرة'),
  bankName: z.string().min(1, 'اسم البنك مطلوب'),
  bankAccount: z.string().min(1, 'رقم الحساب مطلوب'),
  accountHolderName: z.string().min(1, 'اسم صاحب الحساب مطلوب'),
});

// KYC validation
export const kycSchema = z.object({
  idType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE']),
  idFrontImage: z.string().min(1, 'صورة الوثائق مطلوبة'),
  idBackImage: z.string().optional(),
  selfieImage: z.string().min(1, 'صورة السيلفي مطلوبة'),
});

// Report validation
export const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  reportedArticleId: z.string().optional(),
  reason: z.string().min(5, 'سبب البلاغ يجب أن يكون 5 أحرف على الأقل'),
  description: z.string().max(1000).optional(),
});

// Admin validations
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  reason: z.string().optional(),
});

export const updateArticleStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED']),
  reason: z.string().optional(),
});

export const processWithdrawalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PAID']),
  adminNotes: z.string().optional(),
});

export const processKycSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
});

export const processReportSchema = z.object({
  status: z.enum(['REVIEWING', 'RESOLVED', 'DISMISSED']),
  adminNotes: z.string().optional(),
});

// Settings validation
export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
});
