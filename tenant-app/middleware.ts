import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-me-in-production';
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin-react');

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/worker') || pathname.startsWith('/inspector')) {
    return NextResponse.next();
  }

  if (isAdminRoute || (isApiRoute && pathname.split('/').length > 2)) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      // Temporarily allowing unauthenticated POST API requests because Worker Apps 
      // rely on them currently and we haven't authenticated them.
      // E.g., POST to /api/tenantId with ADD_PERSONNEL_TASK.
      if (request.method === 'POST') {
          return NextResponse.next();
      }
      return NextResponse.json({ error: 'Unauthorized. No token provided.' }, { status: 401 });
    }

    try {
      const verified = await jwtVerify(token, getJwtSecret());
      const payload = verified.payload as { role: string; tenantId: string };

      if (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN') {
        if (isAdminRoute) return NextResponse.redirect(new URL('/login', request.url));
        if (request.method === 'POST') return NextResponse.next(); // Allow worker POSTs
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }

      if (isApiRoute) {
        const parts = pathname.split('/');
        const requestedTenantId = parts[2];

        if (payload.role !== 'SUPERADMIN' && payload.tenantId !== requestedTenantId) {
           return NextResponse.json({ error: 'Forbidden. Cross-tenant access denied.' }, { status: 403 });
        }
      }

      const response = NextResponse.next();
      response.headers.set('x-user-tenant', payload.tenantId);
      response.headers.set('x-user-role', payload.role);
      return response;

    } catch (err) {
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (request.method === 'POST') return NextResponse.next();
      return NextResponse.json({ error: 'Unauthorized. Invalid token.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-react', '/api/:path*'],
};
