import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Vision AI – Proxy (Next.js 16 middleware replacement)
 * 
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set with a real key, 
 * replace this file content with the Clerk middleware from:
 * https://clerk.com/docs/quickstarts/nextjs
 * 
 * For now, this passes all requests through without auth.
 */
export default function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
