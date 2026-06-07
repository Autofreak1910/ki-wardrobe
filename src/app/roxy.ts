import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defineRouting } from 'next-intl/routing'

const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'always',
})

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/de/auth/login', request.url))
  }

  return intlMiddleware(request)
}

export { middleware as proxy }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}