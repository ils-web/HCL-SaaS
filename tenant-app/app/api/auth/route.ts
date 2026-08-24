import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "super123";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-me-in-production';
  return new TextEncoder().encode(secret);
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let userRole = '';
    let userTenantId = '';
    let userId = '';

    if (email === 'superadmin' && password === SUPERADMIN_PASSWORD) {
      userRole = 'SUPERADMIN';
      userId = 'superadmin-id';
      userTenantId = 'all';
    } else {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }

      userRole = user.role;
      userTenantId = user.tenantId;
      userId = user.id;
    }

    const token = await new SignJWT({ id: userId, role: userRole, tenantId: userTenantId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(getJwtSecret());

    const response = NextResponse.json({ success: true, token, role: userRole, tenantId: userTenantId });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return response;

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}

