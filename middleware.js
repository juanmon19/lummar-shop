// middleware.js
// Protección de rutas en el Edge de Vercel: bloquea /admin si no existe un JWT válido

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('lummar_admin_token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'lummar_fallback_secret_change_in_vercel_2026'
      );
      const { payload } = await jwtVerify(token, secret);

      if (payload.rol !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
