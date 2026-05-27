/**
 * Helpers de autenticação para testes E2E.
 *
 * Estratégia: para a maioria dos testes, fazer login programaticamente pela UI
 * uma vez e reutilizar a sessão via storageState. Para testes que validam o
 * próprio fluxo de login, NÃO usar estes helpers — usar a UI diretamente.
 */

import type { Page, BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const DEFAULT_TEST_USER = {
  email: "admin@test.com",
  password: "Teste@123",
};

/**
 * Faz login pela UI e preenche o formulário. Retorna quando o dashboard estiver
 * carregado. Use em testes que precisam de uma sessão válida mas não estão
 * testando o login em si.
 */
export async function loginViaUI(
  page: Page,
  email: string = DEFAULT_TEST_USER.email,
  password: string = DEFAULT_TEST_USER.password
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

/**
 * Cria um usuário descartável via service_role e retorna credenciais.
 * O usuário já vem com primeiro_acesso=false e mfa_verificado=true para pular
 * os fluxos intermediários. Use em testes que precisam de isolamento.
 *
 * IMPORTANTE: chame cleanupTestUser(id) no afterEach/afterAll.
 */
export async function createDescartavelUser(opts: {
  municipio_id: string;
  perfil_codigo: string;
  label: string;
}): Promise<{ id: string; email: string; password: string }> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Variáveis SUPABASE necessárias ausentes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `e2e-${opts.label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;
  const password = "E2E@Test123!";

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      municipio_id: opts.municipio_id,
      perfil: opts.perfil_codigo,
      primeiro_acesso: false,
      mfa_verificado: true,
      mfa_obrigatorio: false,
    },
  });
  if (authError || !authData.user) {
    throw new Error(`Falha ao criar usuário descartável: ${authError?.message}`);
  }

  await admin.from("usuarios").insert({
    id: authData.user.id,
    municipio_id: opts.municipio_id,
    email,
    nome: `E2E ${opts.label}`,
    ativo: true,
  });

  await admin.from("usuario_perfis").insert({
    usuario_id: authData.user.id,
    municipio_id: opts.municipio_id,
    perfil_codigo: opts.perfil_codigo,
    ativo: true,
  });

  return { id: authData.user.id, email, password };
}

export async function cleanupTestUser(userId: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await admin.from("usuario_perfis").delete().eq("usuario_id", userId);
  await admin.from("usuarios").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

/**
 * Limpa todos os cookies/storage do contexto. Útil para forçar logout entre
 * testes que dividem o mesmo navegador.
 */
export async function clearAuth(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.clearPermissions();
}
