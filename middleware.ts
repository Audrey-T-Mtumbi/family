import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Firebase handles auth on the client side
  // Just allow all requests through for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}