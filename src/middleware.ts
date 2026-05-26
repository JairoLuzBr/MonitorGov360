import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas que exigem autenticação
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/relatorios"];

// Rotas que usuários autenticados não devem ver (ex: login)
const AUTH_ROUTES = ["/login", "/cadastro", "/recuperar-senha", "/signup", "/mfa", "/primeiro-acesso"];

// Rotas públicas (não são redirecionadas)
const PUBLIC_ROUTES = ["/", "/about", "/contato"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Atualiza a sessão do usuário (refresh token se necessário)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";

  // ===================================================================
  // Extração de tenant pelo subdomínio (municipio)
  // Formato esperado: municipio.localhost:3000 ou municipio.app.example.com
  // ===================================================================
  const parts = hostname.split(".");
  let municipio: string | null = null;

  if (hostname.includes("localhost")) {
    // Para localhost, o municipio vem na primeira posição se não for "localhost"
    if (parts[0] !== "localhost") {
      municipio = parts[0];
    }
  } else {
    // Para produção, o municipio vem no primeiro subdomínio
    // Exemplo: "saopaulo.monitorgov360.com" → municipio = "saopaulo"
    if (parts.length > 2) {
      municipio = parts[0];
    }
  }

  // Adiciona municipio aos headers da resposta para uso em componentes
  if (municipio) {
    supabaseResponse.headers.set("x-municipio", municipio);
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  // ===================================================================
  // Rota protegida sem user → vai para login
  // ===================================================================
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===================================================================
  // Fluxo do usuário autenticado: primeiro_acesso → MFA → dashboard
  // A ordem das checagens importa para evitar loop de redirect
  // ===================================================================
  if (user) {
    const primeiroAcesso = user.user_metadata?.primeiro_acesso === true;
    const mfaObrigatorio = user.user_metadata?.mfa_obrigatorio === true;
    const mfaConfigurado = user.user_metadata?.mfa_verificado === true;

    // 1. primeiro_acesso pendente: força /primeiro-acesso
    if (primeiroAcesso) {
      if (!pathname.startsWith("/primeiro-acesso")) {
        return NextResponse.redirect(new URL("/primeiro-acesso", request.url));
      }
      // já está em /primeiro-acesso → permite renderizar
      return supabaseResponse;
    }

    // 2. MFA pendente: força /mfa
    if (mfaObrigatorio && !mfaConfigurado) {
      if (!pathname.startsWith("/mfa")) {
        return NextResponse.redirect(new URL("/mfa", request.url));
      }
      // já está em /mfa → permite renderizar
      return supabaseResponse;
    }

    // 3. user pronto: redireciona para fora de páginas de auth
    if (isAuthRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 4. B2 — Validação básica: rotas protegidas exigem municipio_id no JWT
    // A RLS policies nas tabelas é a defesa principal contra tenant cross-access
    if (isProtected) {
      const userMunicipio = user.user_metadata?.municipio_id;
      if (!userMunicipio) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Executa o middleware em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - Arquivos de imagens/fontes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
