import { NextRequest, NextResponse } from 'next/server';

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page, auth API, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check auth cookies
  const token = request.cookies.get('auth_token')?.value;
  const hash = request.cookies.get('auth_hash')?.value;

  if (!token || !hash) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const secret = process.env.AUTH_SECRET || 'default-secret';
  const expectedHash = await hmacSha256(secret, token);

  if (hash !== expectedHash) {
    // Invalid token - clear cookies and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('auth_hash', '', { path: '/', maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
