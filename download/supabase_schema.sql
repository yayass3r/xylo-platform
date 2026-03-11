-- ==========================================
-- زايلو (Xylo) - Supabase Database Schema
-- ==========================================
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS & AUTH ====================

CREATE TYPE user_role AS ENUM ('USER', 'CREATOR', 'MODERATOR', 'ADMIN');

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    display_name TEXT,
    avatar TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    social_links JSONB,
    role user_role DEFAULT 'USER',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    referral_code TEXT UNIQUE NOT NULL DEFAULT 'XYLO' || substr(md5(random()::text), 1, 8),
    referred_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ==================== FOLLOWS ====================

CREATE TABLE follows (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- ==================== WALLETS ====================

CREATE TABLE wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    malcoin_balance FLOAT DEFAULT 0,
    quscoin_balance FLOAT DEFAULT 0,
    total_earned FLOAT DEFAULT 0,
    total_withdrawn FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TRANSACTIONS ====================

CREATE TYPE transaction_type AS ENUM ('RECHARGE', 'GIFT_SENT', 'GIFT_RECEIVED', 'WITHDRAWAL', 'REFERRAL_BONUS', 'COMMISSION');
CREATE TYPE currency_type AS ENUM ('MALCOIN', 'QUSCOIN');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount FLOAT NOT NULL,
    currency currency_type NOT NULL,
    description TEXT,
    status transaction_status DEFAULT 'COMPLETED',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ==================== RECHARGE PACKAGES ====================

CREATE TABLE recharge_packages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    malcoin_amount FLOAT NOT NULL,
    price_usd FLOAT NOT NULL,
    bonus_malcoin FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== GIFTS ====================

CREATE TABLE gifts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    cost FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE gift_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    gift_id TEXT NOT NULL REFERENCES gifts(id),
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id TEXT,
    message TEXT,
    malcoin_value FLOAT NOT NULL,
    quscoin_value FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gift_transactions_sender_id ON gift_transactions(sender_id);
CREATE INDEX idx_gift_transactions_receiver_id ON gift_transactions(receiver_id);
CREATE INDEX idx_gift_transactions_article_id ON gift_transactions(article_id);

-- ==================== ARTICLES ====================

CREATE TYPE article_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE articles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    category TEXT,
    tags TEXT[],
    status article_status DEFAULT 'DRAFT',
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    gift_count INT DEFAULT 0,
    gift_value FLOAT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    read_time INT DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_is_featured ON articles(is_featured);
CREATE INDEX idx_articles_is_trending ON articles(is_trending);

-- ==================== ARTICLE LIKES ====================

CREATE TABLE article_likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

CREATE INDEX idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX idx_article_likes_user_id ON article_likes(user_id);

-- ==================== BOOKMARKS ====================

CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- ==================== HASHTAGS ====================

CREATE TABLE hashtags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE article_hashtags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    hashtag_id TEXT NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    UNIQUE(article_id, hashtag_id)
);

CREATE INDEX idx_article_hashtags_hashtag_id ON article_hashtags(hashtag_id);

-- ==================== COMMENTS ====================

CREATE TABLE comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    likes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_article_id ON comments(article_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- ==================== WITHDRAWALS ====================

CREATE TYPE withdrawal_method AS ENUM ('STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

CREATE TABLE withdrawal_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL,
    usd_amount FLOAT NOT NULL,
    method withdrawal_method NOT NULL,
    account_info TEXT NOT NULL,
    status withdrawal_status DEFAULT 'PENDING',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ==================== REFERRALS ====================

CREATE TABLE referrals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bonus_paid BOOLEAN DEFAULT false,
    bonus_amount FLOAT DEFAULT 0,
    commission FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- ==================== NOTIFICATIONS ====================

CREATE TYPE notification_type AS ENUM ('GIFT_RECEIVED', 'NEW_COMMENT', 'REFERRAL_BONUS', 'WITHDRAWAL_STATUS', 'ARTICLE_LIKED', 'NEW_FOLLOWER', 'ARTICLE_BOOKMARKED', 'MENTION', 'SYSTEM');

CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ==================== REPORTS ====================

CREATE TYPE report_type AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT', 'MISINFORMATION', 'OTHER');
CREATE TYPE report_target AS ENUM ('ARTICLE', 'COMMENT', 'USER');
CREATE TYPE report_status AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

CREATE TABLE reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type report_type NOT NULL,
    reason TEXT NOT NULL,
    target_type report_target NOT NULL,
    target_id TEXT NOT NULL,
    status report_status DEFAULT 'PENDING',
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ==================== SITE SETTINGS ====================

CREATE TABLE site_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INSERT DEFAULT DATA
-- ==========================================

-- Insert Admin User
INSERT INTO users (email, password, name, display_name, role, is_verified, referral_code) VALUES
('admin@xylo.social', '$2a$10$rQZ9QxZQxZQxZQxZQxZQxOZJ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'مدير النظام', 'Admin', 'ADMIN', true, 'XYLOADMIN001'),
('yasser@xylo.social', '$2a$10$rQZ9QxZQxZQxZQxZQxZQxOZJ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'ياسر', 'Yasser', 'CREATOR', true, 'XYLOCREATOR001');

-- Insert Wallets for Users
INSERT INTO wallets (user_id, malcoin_balance, quscoin_balance, total_earned)
SELECT id, 1000, 500, 1000 FROM users WHERE email = 'admin@xylo.social';

INSERT INTO wallets (user_id, malcoin_balance, quscoin_balance, total_earned)
SELECT id, 500, 250, 500 FROM users WHERE email = 'yasser@xylo.social';

-- Insert Recharge Packages
INSERT INTO recharge_packages (name, description, malcoin_amount, price_usd, bonus_malcoin, sort_order) VALUES
('basic', 'باقة أساسية - 100 مالكوين', 100, 1.99, 0, 1),
('standard', 'باقة قياسية - 500 مالكوين + 50_bonus', 500, 8.99, 50, 2),
('premium', 'باقة مميزة - 1000 مالكوين + 150_bonus', 1000, 16.99, 150, 3),
('ultimate', 'باقة ultimate - 2500 مالكوين + 500_bonus', 2500, 39.99, 500, 4);

-- Insert Gifts
INSERT INTO gifts (name, name_ar, description, icon, cost, sort_order) VALUES
('rose', 'وردة', 'وردة جميلة للتقدير', '🌹', 10, 1),
('heart', 'قلب', 'قلب حب ودعم', '❤️', 25, 2),
('star', 'نجمة', 'نجمة تميز', '⭐', 50, 3),
('trophy', 'كأس', 'كأس البطل', '🏆', 100, 4),
('crown', 'تاج', 'تاج الملك', '👑', 250, 5),
('diamond', 'ماسة', 'ماسة ثمينة', '💎', 500, 6),
('rocket', 'صاروخ', 'صاروخ نحو القمة', '🚀', 1000, 7);

-- Insert Site Settings
INSERT INTO site_settings (key, value) VALUES
('site_name', 'زايلو'),
('site_description', 'منصة دعم صُنّاع المحتوى العربي'),
('malcoin_to_usd', '0.01'),
('quscoin_to_usd', '0.005'),
('min_withdrawal_amount', '100'),
('referral_bonus_amount', '50');

-- ==========================================
-- SAMPLE ARTICLES
-- ==========================================

INSERT INTO articles (author_id, title, slug, content, excerpt, category, status, views, likes, is_featured, is_trending, published_at)
SELECT 
    id,
    'مرحباً بكم في زايلو',
    'welcome-to-xylo',
    '# مرحباً بكم في زايلو

زايلو هي منصة عربية مبتكرة لدعم صُنّاع المحتوى. تمكنك المنصة من:

## المميزات الرئيسية

- **نظام الهدايا**: أرسل هدايا رمزية لصنّاع المحتوى المفضلين لديك
- **نظام العملات**: استخدم MALCOIN و QUSCOIN لدعم المبدعين
- **المقالات**: شارك أفكارك ومحتواك مع المجتمع
- **المتابعون**: بناء قاعدة جمهورية مخلصة

انضم إلينا اليوم وكن جزءاً من مجتمع المبدعين العرب!',
    'مرحباً بكم في زايلو - المنصة العربية لدعم صنّاع المحتوى',
    'أخبار',
    'PUBLISHED',
    1250,
    85,
    true,
    true,
    NOW()
FROM users WHERE email = 'admin@xylo.social';

-- Insert Hashtags
INSERT INTO hashtags (name, count) VALUES
('زايلو', 5),
('صناعة_المحتوى', 3),
('إبداع', 2),
('محتوى_عربي', 4),
('دعم_المبدعين', 3);

-- ==========================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gifts_updated_at BEFORE UPDATE ON gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recharge_packages_updated_at BEFORE UPDATE ON recharge_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public articles are viewable by everyone" ON articles FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT USING (auth.uid()::text = user_id);

-- Insert notification for admin
INSERT INTO notifications (user_id, type, title, message)
SELECT id, 'SYSTEM', 'مرحباً بك في زايلو!', 'شكراً لانضمامك إلى منصة زايلو. نرحب بك كعضو في مجتمعنا.'
FROM users WHERE email = 'admin@xylo.social';

-- ==========================================
-- DONE!
-- ==========================================
