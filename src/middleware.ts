import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Les chunks buildés (_next/static) changent à chaque déploiement.
  // Next les sert avec "immutable" par défaut, ce qui empêche le navigateur
  // de revalider : après un rebuild, l'ancienne URL de chunk 404 et la page casse.
  // On force no-store pour garantir une revalidation systématique.
  if (pathname.startsWith("/_next/static/")) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/_next/static/:path*"],
};
