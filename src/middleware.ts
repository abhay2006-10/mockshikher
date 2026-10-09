import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role || (req.auth as any)?.role;

  // Redirect already logged-in users away from auth pages
  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    if (isLoggedIn) {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
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
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect student dashboard routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/mistakes') ||
    pathname.startsWith('/bookmarks')
  ) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect test taking
  if (pathname.match(/^\/test\/[^/]+\/attempt/)) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', req.url);
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
