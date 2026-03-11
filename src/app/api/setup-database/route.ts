import { NextRequest, NextResponse } from 'next/server';

// This endpoint initializes the database schema using Supabase REST API
// Call it once: GET /api/setup-database

const SUPABASE_URL = 'https://bzpgmovnjiqihvzkctlr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cGdtb3ZuamlxaWh2emtjdGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODU2MTMsImV4cCI6MjA4ODY2MTYxM30.4n9pnUILTGNvak9qWplJWqKrUOpMaVNEzDr96zLYvrs';

async function supabaseRequest(table: string, method: string = 'GET', body?: any) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response;
}

export async function GET(request: NextRequest) {
  const results: { table: string; status: string; error?: string }[] = [];
  
  try {
    // Check if tables exist by trying to query them
    const tablesToCheck = ['users', 'wallets', 'gifts', 'articles', 'recharge_packages'];
    
    for (const table of tablesToCheck) {
      const check = await supabaseRequest(`${table}?select=count&limit=1`);
      results.push({
        table,
        status: check.ok ? 'exists' : 'not_found',
        error: check.ok ? undefined : `Status: ${check.status}`
      });
    }
    
    const allExist = results.every(r => r.status === 'exists');
    
    if (allExist) {
      return NextResponse.json({ 
        success: true, 
        message: '✅ جميع الجداول موجودة وجاهزة!',
        tables: results,
        status: 'ready'
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: '⚠️ بعض الجداول غير موجودة. يرجى تنفيذ SQL في Supabase SQL Editor.',
      tables: results,
      sqlFile: '/download/supabase_schema.sql',
      instructions: [
        '1️⃣ اذهب إلى: https://supabase.com/dashboard/project/bzpgmovnjiqihvzkctlr/sql',
        '2️⃣ انسخ محتوى الملف: /download/supabase_schema.sql',
        '3️⃣ الصق في SQL Editor واضغط Run'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      tables: results
    }, { status: 500 });
  }
}

// POST to insert seed data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data } = body;
    
    const response = await supabaseRequest(table, 'POST', data);
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: `Data inserted into ${table}` 
      });
    }
    
    const error = await response.text();
    return NextResponse.json({ 
      success: false, 
      error 
    }, { status: response.status });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
