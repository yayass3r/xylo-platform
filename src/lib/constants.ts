// Currency conversion rates
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
