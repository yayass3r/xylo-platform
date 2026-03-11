import { NextRequest, NextResponse } from 'next/server';

// Initialize database with seed data
// Call: POST /api/init-db

const SUPABASE_URL = 'https://bzpgmovnjiqihvzkctlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cGdtb3ZuamlxaWh2emtjdGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODU2MTMsImV4cCI6MjA4ODY2MTYxM30.4n9pnUILTGNvak9qWplJWqKrUOpMaVNEzDr96zLYvrs';

async function supabaseRequest(table: string, method: string = 'GET', body?: any, query?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response;
}

export async function POST(request: NextRequest) {
  const results: { action: string; status: string; message: string }[] = [];
  
  try {
    // Check if already initialized
    const checkUsers = await supabaseRequest('users?select=id&limit=1');
    
    if (checkUsers.ok) {
      const data = await checkUsers.json();
      if (data && data.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'قاعدة البيانات جاهزة بالفعل',
          results: [{ action: 'check', status: 'skipped', message: 'البيانات موجودة' }]
        });
      }
    }

    // Insert sample data using Supabase REST API
    // Users
    await supabaseRequest('users', 'POST', {
      id: 'admin_001',
      email: 'admin@xylo.social',
      password: 'hashed_password_here',
      name: 'مدير النظام',
      role: 'ADMIN'
    });
    results.push({ action: 'insert admin', status: 'success', message: 'تم إنشاء المدير' });

    // Gifts
    const gifts = [
      { name: 'rose', name_ar: 'وردة', icon: '🌹', cost: 10, sort_order: 1 },
      { name: 'heart', name_ar: 'قلب', icon: '❤️', cost: 25, sort_order: 2 },
      { name: 'star', name_ar: 'نجمة', icon: '⭐', cost: 50, sort_order: 3 },
      { name: 'trophy', name_ar: 'كأس', icon: '🏆', cost: 100, sort_order: 4 },
      { name: 'diamond', name_ar: 'ماسة', icon: '💎', cost: 500, sort_order: 5 }
    ];

    for (const gift of gifts) {
      await supabaseRequest('gifts', 'POST', gift);
    }
    results.push({ action: 'insert gifts', status: 'success', message: 'تم إضافة الهدايا' });

    // Settings
    await supabaseRequest('site_settings', 'POST', { key: 'site_name', value: 'زايلو' });
    results.push({ action: 'insert settings', status: 'success', message: 'تم إضافة الإعدادات' });

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح',
      results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}
