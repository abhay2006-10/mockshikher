import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

function getRedirectUrl(path: string, req: NextRequest | any): URL {
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || (forwardedHost?.includes('localhost') ? 'http' : 'https');
  const base = forwardedHost ? `${forwardedProto}://${forwardedHost}` : (process.env.NEXTAUTH_URL || 'https://mockshikhar.com');
  return new URL(path, base);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role || (req.auth as any)?.role;

  // Redirect already logged-in users away from auth pages
  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    if (isLoggedIn) {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(getRedirectUrl('/admin', req));
      }
      return NextResponse.redirect(getRedirectUrl('/dashboard', req));
    }
    return NextResponse.next();
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }
  }

  // Protect admin UI routes
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = getRedirectUrl('/auth/login', req);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(getRedirectUrl('/dashboard', req));
    }
  }

  // Protect student dashboard routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/mistakes') ||
    pathname.startsWith('/bookmarks')
  ) {
    if (!isLoggedIn) {
      const loginUrl = getRedirectUrl('/auth/login', req);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect test taking
  if (pathname.match(/^\/test\/[^/]+\/attempt/)) {
    if (!isLoggedIn) {
      const loginUrl = getRedirectUrl('/auth/login', req);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/auth/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/mistakes/:path*',
    '/bookmarks/:path*',
    '/test/:path*/attempt',
  ],
};
