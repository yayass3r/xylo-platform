// Currency conversion rates
import { Article, User, Notification, Wallet, Transaction } from '@prisma/client';

// Re-export Prisma types
export type { Article, User, Notification, Transaction };

// Extended Article type with relations and computed fields
export interface ArticleWithAuthor extends Article {
  author: Pick<User, 'id' | 'name' | 'displayName' | 'avatar' | 'isVerified'>;
  isLiked?: boolean;
  isBookmarked?: boolean;
  _count?: {
    comments: number;
    likes: number;
  };
}

// Extended User type with wallet relation
export interface UserWithWallet extends User {
  wallet: Wallet | null;
}

export const CURRENCY_RATES = {
  MALCOIN_PER_USD: 500, // 1 USD = 500 MALCOIN
  QUSCOIN_COMMISSION: 0.8, // 80% goes to creator
  PLATFORM_COMMISSION: 0.2, // 20% platform fee
} as const;

// Referral rewards
export const REFERRAL_REWARDS = {
  SIGNUP_BONUS_USD: 50, // $50 worth of MALCOIN
  SIGNUP_BONUS_MALCOIN: 50 * 500, // 25000 MALCOIN
  COMMISSION_RATE: 0.02, // 2% commission
} as const;

// Withdrawal settings
export const WITHDRAWAL_SETTINGS = {
  MIN_AMOUNT_QUSCOIN: 1000, // Minimum withdrawal
  PROCESSING_FEE_PERCENT: 0, // No fee
} as const;

// QUSCOIN to USD conversion
export function quscoinToUSD(quscoin: number): number {
  return quscoin / 500; // 500 QUSCOIN = 1 USD
}

// USD to MALCOIN conversion
export function usdToMalcoin(usd: number): number {
  return usd * CURRENCY_RATES.MALCOIN_PER_USD;
}

// MALCOIN to USD conversion
export function malcoinToUSD(malcoin: number): number {
  return malcoin / CURRENCY_RATES.MALCOIN_PER_USD;
}

// Calculate QUSCOIN from gift MALCOIN value
export function malcoinToQuscoin(malcoin: number): number {
  return malcoin * CURRENCY_RATES.QUSCOIN_COMMISSION;
}

// Withdrawal methods with display names (Arabic)
export const WITHDRAWAL_METHODS = [
  { id: 'STRIPE', name: 'Stripe', nameAr: 'ستريب' },
  { id: 'PAYPAL', name: 'PayPal', nameAr: 'باي بال' },
  { id: 'MOYASAR', name: 'Moyasar', nameAr: 'مياسر' },
  { id: 'STC_PAY', name: 'STC Pay', nameAr: 'STC Pay' },
  { id: 'PAYONEER', name: 'Payoneer', nameAr: 'بايونير' },
  { id: 'SKRILL', name: 'Skrill', nameAr: 'سكريل' },
] as const;

// Article categories
export const ARTICLE_CATEGORIES = [
  { id: 'technology', name: 'تقنية', icon: '💻' },
  { id: 'business', name: 'أعمال', icon: '💼' },
  { id: 'lifestyle', name: 'أسلوب حياة', icon: '✨' },
  { id: 'education', name: 'تعليم', icon: '📚' },
  { id: 'entertainment', name: 'ترفيه', icon: '🎮' },
  { id: 'health', name: 'صحة', icon: '🏥' },
  { id: 'sports', name: 'رياضة', icon: '⚽' },
  { id: 'travel', name: 'سفر', icon: '✈️' },
  { id: 'food', name: 'طعام', icon: '🍕' },
  { id: 'other', name: 'أخرى', icon: '📝' },
] as const;

// Default gifts
export const DEFAULT_GIFTS = [
  { name: 'Coffee', nameAr: 'قهوة', icon: '☕', cost: 100, sortOrder: 1 },
  { name: 'Rose', nameAr: 'وردة', icon: '🌹', cost: 250, sortOrder: 2 },
  { name: 'Heart', nameAr: 'قلب', icon: '❤️', cost: 500, sortOrder: 3 },
  { name: 'Star', nameAr: 'نجمة', icon: '⭐', cost: 1000, sortOrder: 4 },
  { name: 'Crown', nameAr: 'تاج', icon: '👑', cost: 2500, sortOrder: 5 },
  { name: 'Rocket', nameAr: 'صاروخ', icon: '🚀', cost: 5000, sortOrder: 6 },
  { name: 'Diamond', nameAr: 'ماسة', icon: '💎', cost: 10000, sortOrder: 7 },
  { name: 'Unicorn', nameAr: 'حصان وحيد القرن', icon: '🦄', cost: 25000, sortOrder: 8 },
] as const;

// Default recharge packages
export const DEFAULT_RECHARGE_PACKAGES = [
  { name: 'Basic', nameAr: 'أساسي', malcoinAmount: 500, priceUSD: 1, bonusMalcoin: 0, sortOrder: 1 },
  { name: 'Starter', nameAr: 'مبتدئ', malcoinAmount: 2500, priceUSD: 5, bonusMalcoin: 125, sortOrder: 2 },
  { name: 'Popular', nameAr: 'شائع', malcoinAmount: 5000, priceUSD: 10, bonusMalcoin: 500, sortOrder: 3 },
  { name: 'Premium', nameAr: 'مميز', malcoinAmount: 12500, priceUSD: 25, bonusMalcoin: 2500, sortOrder: 4 },
  { name: 'Professional', nameAr: 'احترافي', malcoinAmount: 25000, priceUSD: 50, bonusMalcoin: 7500, sortOrder: 5 },
  { name: 'Enterprise', nameAr: 'مؤسسي', malcoinAmount: 50000, priceUSD: 100, bonusMalcoin: 20000, sortOrder: 6 },
] as const;

// Transaction type labels
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  RECHARGE: 'شحن رصيد',
  GIFT_SENT: 'هدية مرسلة',
  GIFT_RECEIVED: 'هدية مستلمة',
  WITHDRAWAL: 'سحب رصيد',
  REFERRAL_BONUS: 'مكافأة إحالة',
  COMMISSION: 'عمولة',
};

// Utility functions
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(dateString: string | Date): string {
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
  
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
