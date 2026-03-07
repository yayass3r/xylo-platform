import { NextResponse, type NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies or authorization header
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  let user = null;
  
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'xylo-super-secret-jwt-key-change-in-production-2024';
      user = jwt.verify(token, secret) as { userId: string; email: string; role: string };
    } catch {
      // Token is invalid or expired
      user = null;
    }
  }

  // Protected routes
  const protectedPaths = ['/admin', '/wallet', '/settings', '/messages'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && user) {
    if (user.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Writer-only routes (writers and admins)
  if (pathname.startsWith('/writer') && user) {
    if (!['WRITER', 'ADMIN'].includes(user.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // If logged in user tries to access login/register pages, redirect to home
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
