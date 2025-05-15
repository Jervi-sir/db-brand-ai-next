import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

// Initialize NextAuth middleware
const authMiddleware: any = NextAuth(authConfig).auth;

// Custom middleware to clean callbackUrl
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Remove callbackUrl for /login or /register
  if (['/login', '/register'].includes(pathname) && searchParams.toString()) {
    const url = request.nextUrl.clone();
    url.search = ''; // Clear all query parameters
    return NextResponse.redirect(url);
  }

  // Apply NextAuth middleware for authentication
  return authMiddleware(request);
}

export const config = {
  matcher: ['/', 
    '/login', 
    '/register', 
    '/api/auth', 
    '/split',
    '/split-v2',
    '/todo-list',
    '/calendar',
    '/kanban',

  ], // '/:id', '/api/:path*', 
};
