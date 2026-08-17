import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-me-in-production';
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin-react');

  // Completely public routes
  if (
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/api/superadmin') || 
    pathname.startsWith('/api/dev') || 
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/login') || 
    pathname.startsWith('/worker') || 
    pathname.startsWith('/inspector') ||
    pathname.startsWith('/report')
  ) {
    return NextResponse.next();
  }

  // Handle Tenant API requests (/api/[tenantId])
  if (isApiRoute) {
    const parts = pathname.split('/');
    // Check if it matches /api/[tenantId]
    if (parts.length >= 3) {
      const action = searchParams.get('action');

      // getSettings is public for Inspector and Report apps to fetch tenant name, categories, systems, and active hours
      if (request.method === 'GET' && action === 'getSettings') {
        return NextResponse.next();
      }

      // POST requests from Inspector (room checks), Report QR, and Worker App are public with tenantId validation in route
      if (request.method === 'POST') {
        return NextResponse.next();
      }
    }
  }

  // Admin protected routes: /admin-react and Admin GET API actions (getOpenTasks, getReports, etc.)
  if (isAdminRoute || (isApiRoute && request.method === 'GET')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.json({ error: 'Unauthorized. No token provided.' }, { status: 401 });
    }

    try {
      const verified = await jwtVerify(token, getJwtSecret());
      const payload = verified.payload as { role: string; tenantId: string };

      if (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN') {
        if (isAdminRoute) return NextResponse.redirect(new URL('/login', request.url));
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
      return NextResponse.json({ error: 'Unauthorized. Invalid token.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-react', '/api/:path*'],
};
