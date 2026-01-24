import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept socket.io requests
  if (pathname.startsWith('/socket.io')) {
    const targetBase = process.env.REALTIME_SERVICE_URL || 'http://localhost:3006';
    const url = request.nextUrl.clone();
    
    // Construct the target URL
    // Note: Middleware rewrites happen internal to the Next.js server
    // We are rewriting to the internal docker service
    return NextResponse.rewrite(`${targetBase}${pathname}${url.search}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/socket.io/:path*',
};
