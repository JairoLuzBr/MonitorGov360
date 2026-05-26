import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cria um cliente Supabase para uso em Server Components, Server Actions
 * e Route Handlers. Lê e escreve cookies automaticamente para manter
 * a sessão do usuário.
 *
 * Deve ser chamado dentro de um contexto assíncrono do servidor.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Em Server Components, não é possível definir cookies.
            // Isso é seguro de ignorar — o middleware cuida da sessão.
          }
        },
      },
    }
  );
}

/**
 * Cria um cliente Supabase com a chave de serviço (service role).
 * Use APENAS em operações administrativas no servidor.
 * NUNCA exponha este cliente para o navegador.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignorado em Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
