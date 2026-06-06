import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth/jwt';

// Public API endpoints that don't need auth
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);

  // Check if it's an API route or page under dashboard
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicApi = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
  const isDashboardPage =
    pathname.startsWith('/vendors') ||
    pathname.startsWith('/rfqs') ||
    pathname.startsWith('/quotations') ||
    pathname.startsWith('/approvals') ||
    pathname.startsWith('/purchase-orders') ||
    pathname.startsWith('/invoices') ||
    pathname.startsWith('/payment-ledger') ||
    pathname.startsWith('/activity-logs') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/vendor-portal') ||
    pathname === '/';

  // If it's a public API path, let it pass
  if (isApiRoute && isPublicApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // If it's a protected API route or dashboard page, verify access token
  if (isApiRoute || isDashboardPage) {
    const authHeader = request.headers.get('authorization');
    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie check for page visits
      token = request.cookies.get('access_token')?.value || '';
    }

    if (!token) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Token is missing.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Token is invalid or expired.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based route guarding
    const userRole = payload.role;

    if (userRole === 'VENDOR') {
      // Vendors can only access vendor-portal, purchase-orders, invoices, quotations, settings
      if (
        isDashboardPage &&
        !pathname.startsWith('/vendor-portal') &&
        !pathname.startsWith('/quotations/submit') &&
        !pathname.startsWith('/purchase-orders') &&
        !pathname.startsWith('/invoices') &&
        !pathname.startsWith('/settings')
      ) {
        return NextResponse.redirect(new URL('/vendor-portal', request.url));
      }
    } else {
      // Internal users shouldn't access the vendor portal
      if (isDashboardPage && pathname.startsWith('/vendor-portal')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Approver cannot create new RFQs
      if (userRole === 'APPROVER' && pathname.startsWith('/rfqs/new')) {
        return NextResponse.redirect(new URL('/rfqs', request.url));
      }
    }

    // Inject user info into headers for downstream server components / route handlers
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-org-id', payload.orgId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-email', payload.email);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Config to specify matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
