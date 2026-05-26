/**
 * Funções de autenticação que usam "next/headers" (Server Components apenas)
 * Não importar este arquivo em Client Components
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// ===================================================================
// CLIENTE SUPABASE (SERVER-SIDE)
// ===================================================================

async function createServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as any);
            });
          } catch {
            // Em Server Components não é possível definir cookies
          }
        },
      },
    }
  );
}

// ===================================================================
// USUÁRIO ATUAL (SERVER-SIDE)
// ===================================================================

/**
 * Obtém dados do usuário autenticado (server-side)
 * Deve ser chamado de Server Components ou Route Handlers
 * @returns Dados do usuário ou null se não autenticado
 */
export async function getCurrentUserServer() {
  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      user_metadata: data.user.user_metadata,
    };
  } catch {
    return null;
  }
}

// ===================================================================
// SESSÃO (SERVER-SIDE)
// ===================================================================

/**
 * Atualiza (refresh) a sessão do usuário
 * Chamado pelo middleware para renovar o token JWT
 * @returns Nova sessão ou null se falha
 */
export async function refreshUserSession() {
  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return null;
    }

    return data.session;
  } catch {
    return null;
  }
}
