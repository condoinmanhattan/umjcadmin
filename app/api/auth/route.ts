import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
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
      const token = generateToken();
      const response = NextResponse.json({ success: true });

      // Set HTTP-only cookie valid for 7 days
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Store the token hash for validation
      const secret = process.env.AUTH_SECRET || 'default-secret';
      const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
      response.cookies.set('auth_hash', hash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
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
  response.cookies.set('auth_hash', '', { path: '/', maxAge: 0 });
  return response;
}

// GET: check auth status
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const hash = request.cookies.get('auth_hash')?.value;

  if (!token || !hash) {
    return NextResponse.json({ authenticated: false });
  }

  const secret = process.env.AUTH_SECRET || 'default-secret';
  const expectedHash = crypto.createHmac('sha256', secret).update(token).digest('hex');

  if (hash === expectedHash) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}
