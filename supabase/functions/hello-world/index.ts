// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

serve(async (req: Request) => {
  const { method } = req
  const url = new URL(req.url)
  
  try {
    // Parse request body
    let body: any = {}
    if (req.body) {
        const reader = req.body.getReader()
        body = JSON.parse(await reader.readAll())
    }
    
    // Handle different routes
    const path = url.pathname
    
    // Hello World endpoint
    if (path.endsWith('/hello-world') && method === 'POST') {
        const name = body?.name || 'World'
        return new Response(
            JSON.stringify({
                message: `مرحباً ${name}! 🎉`,
                greeting: `Hello ${name}! Welcome to Xylo Platform!`,
                timestamp: new Date().toISOString(),
                platform: 'Xylo - منصة دعم صُنّاع المحتوى العربي'
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
    
    // Initialize Database endpoint
    if (path.endsWith('/init-db') && method === 'POST') {
        try {
            // Check if tables exist
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .limit(1)
            
            if (error) {
                // Tables don't exist, create them
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: '⚠️ جداول قاعدة البيانات غير موجودة',
                        instructions: [
                            '1️⃣ افتح Supabase SQL Editor',
                            '2️⃣ انسخ محتوى ملف supabase_schema.sql',
                            '3️⃣ الصق في SQL Editor واضغط Run'
                        ]
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                )
            }
            
            return new Response(
                JSON.stringify({
                    success: true,
                    message: '✅ قاعدة البيانات جاهزة!',
                    tablesExist: true
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        } catch (err) {
            return new Response(
                JSON.stringify({ error: err.message }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }
    }
    
    // Get all gifts
    if (path.endsWith('/gifts') && method === 'GET') {
        const { data, error } = await supabase
            .from('gifts')
            .select('*')
            .order('sort_order', { ascending: true })
        
        return new Response(
            JSON.stringify({ data, error }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
    
    // Default response
    return new Response(
        JSON.stringify({
            message: 'مرحباً بك في Xylo API!',
            endpoints: {
                'POST /hello-world': 'احصل على ترحيب',
                'POST /init-db': 'تهيئة قاعدة البيانات',
                'GET /gifts': 'الحصول على قائمة الهدايا'
            }
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    )
    
  } catch (error) {
    return new Response(
        JSON.stringify({ error: error.message }),
        {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    )
  }
})
