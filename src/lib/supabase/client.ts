import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * تسجيل الدخول عبر Google OAuth (Client-side)
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    return { error };
  }

  return { data };
}

/**
 * تسجيل الدخول بالبريد وكلمة المرور
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in with email:', error);
    return { error };
  }

  return { data };
}

/**
 * إنشاء حساب جديد بالبريد وكلمة المرور
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { name?: string; username?: string },
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    console.error('Error signing up with email:', error);
    return { error };
  }

  return { data };
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    return { error };
  }

  return { success: true };
}

/**
 * الحصول على الجلسة الحالية
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

/**
 * الحصول على المستخدم الحالي
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

/**
 * الاستماع لتغييرات المصادقة
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}
