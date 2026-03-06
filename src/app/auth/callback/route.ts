import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user after successful authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user exists in our database
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          // Create new user in our database
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              password: '', // OAuth users don't have passwords
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              username:
                user.user_metadata?.user_name ||
                user.email?.split('@')[0] + '_' + user.id.slice(0, 6),
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              isEmailVerified: user.email_confirmed_at ? true : false,
              referralCode: generateReferralCode(),
            },
          });

          // Create wallet for user
          await prisma.wallet.create({
            data: {
              userId: dbUser.id,
              coinsBalance: 0,
              diamondsBalance: 0,
            },
          });
        } else {
          // Update user info from OAuth provider
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || dbUser.avatar,
              isEmailVerified: user.email_confirmed_at ? true : dbUser.isEmailVerified,
            },
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

/**
 * توليد كود إحالة عشوائي
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'XYLO_';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
