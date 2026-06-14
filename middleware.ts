import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  void fetch(`${process.env.NEXT_PUBLIC_URL || url.origin}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: url.pathname }),
  }).catch((error) => {
    console.error("Visit tracking failed:", error);
  });

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
