import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

/**
 * Middleware for authentication and authorization
 * Uses jose library for JWT verification (Edge Runtime compatible)
 */

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Get JWT secret key as Uint8Array for jose library
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify JWT token using jose library
 */
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies or authorization header
  const tokenFromCookie = request.cookies.get('token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = tokenFromCookie || tokenFromHeader;
  
  let user: JWTPayload | null = null;
  
  if (token) {
    user = await verifyToken(token);
    
    // If token is invalid and exists in cookie, clear it
    if (!user && tokenFromCookie) {
      const response = NextResponse.next();
      response.cookies.delete('token');
      response.cookies.delete('refreshToken');
      return response;
    }
  }

  // Protected routes that require authentication
  const protectedPaths = ['/admin', '/wallet', '/settings', '/messages', '/profile', '/writer'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // If trying to access protected route without valid authentication
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(url);
    // Clear any invalid cookies
    response.cookies.delete('token');
    response.cookies.delete('refreshToken');
    return response;
  }

  // Admin-only routes - require ADMIN role
  if (pathname.startsWith('/admin') && user) {
    if (user.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Writer-only routes - require WRITER or ADMIN role
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
     * - public folder files
     * - api routes (handled separately with their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
