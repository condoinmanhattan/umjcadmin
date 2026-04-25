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

// POST: login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password } = body;

    const adminId = process.env.ADMIN_ID;
    const adminPw = process.env.ADMIN_PW;

    if (!adminId || !adminPw) {
      return NextResponse.json(
        { error: '서버 인증 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    if (id === adminId && password === adminPw) {
      const secret = process.env.AUTH_SECRET || 'default-secret';
      const token = await hmacSha256(secret, 'admin_login_success');
      
      const response = NextResponse.json({ success: true });

      // Set HTTP-only cookie valid for 7 days
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
  return response;
}

// GET: check auth status
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const secret = process.env.AUTH_SECRET || 'default-secret';
  const expectedToken = await hmacSha256(secret, 'admin_login_success');

  if (token === expectedToken) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}
