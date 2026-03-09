import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware for authentication and authorization
 * Uses jose library for JWT verification (Edge Runtime compatible)
 *
 * NOTE: This middleware does NOT perform locale-based URL prefixing.
 * The i18n system uses cookie/header-based locale detection instead of
 * URL segments (e.g., /en/profile). Pages live directly in src/app/.
 */

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Get JWT secret key as Uint8Array for jose library.
 * Returns null if JWT_SECRET is not configured, allowing
 * the middleware to continue without crashing.
 */
function getSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify JWT token using jose library.
 * Returns null if the token is invalid or JWT_SECRET is not configured.
 */
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    if (!secretKey) {
      return null;
    }
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  // (also covered by matcher, but added as a safety net)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

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
  const isProtectedPath = protectedPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );

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
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && user) {
    if (user.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Writer-only routes - require WRITER or ADMIN role
  if ((pathname === '/writer' || pathname.startsWith('/writer/')) && user) {
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
