/**
 * Testes E2E — Fluxos críticos do dashboard.
 *
 * Valida que as páginas principais do dashboard carregam corretamente para
 * um usuário autenticado e renderizam os elementos esperados sem erros de
 * console. Usa um único usuário descartável (perfil "prefeito" — visão total)
 * compartilhado entre os testes para reduzir overhead.
 */

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  cleanupTestUser,
  createDescartavelUser,
  loginViaUI,
} from "./helpers/auth-helpers";

// Rodar serial para evitar race nas autenticações compartilhando o mesmo usuário
test.describe.configure({ mode: "serial" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let municipioId: string;
let userId: string;
let userEmail: string;
let userPassword: string;

test.beforeAll(async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin
    .from("municipios")
    .select("id")
    .eq("ativo", true)
    .limit(1)
    .single();
  if (error || !data) {
    throw new Error("Nenhum município ativo. Rode 'npm run seed-test' antes.");
  }
  municipioId = data.id;

  const user = await createDescartavelUser({
    municipio_id: municipioId,
    perfil_codigo: "prefeito",
    label: "fluxos-criticos",
  });
  userId = user.id;
  userEmail = user.email;
  userPassword = user.password;
});

test.afterAll(async () => {
  if (userId) await cleanupTestUser(userId);
});

test.beforeEach(async ({ page }) => {
  await loginViaUI(page, userEmail, userPassword);
});

// ===========================================================================
// PÁGINAS PRINCIPAIS — cada uma deve carregar com seu heading
// ===========================================================================

const paginas: Array<{ path: string; heading: RegExp }> = [
  { path: "/dashboard", heading: /Painel Executivo|Dashboard|Visão Geral/i },
  { path: "/dashboard/acoes", heading: /Ações Governamentais/i },
  { path: "/dashboard/alertas", heading: /Alertas/i },
  { path: "/dashboard/evidencias", heading: /Evidências/i },
  { path: "/dashboard/questionarios", heading: /Questionários/i },
  { path: "/dashboard/orcamento", heading: /Execução Orçamentária/i },
  { path: "/dashboard/auditoria", heading: /Trilha de Auditoria/i },
  { path: "/dashboard/relatorios", heading: /Relatórios/i },
  { path: "/dashboard/configuracoes", heading: /Configurações/i },
];

for (const { path, heading } of paginas) {
  test(`${path} carrega e renderiza heading "${heading.source}"`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(path);
    // Aguarda heading principal aparecer
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("h1").first()).toHaveText(heading);

    // Ignora warnings/erros não-bloqueantes: hidratação do React em dev,
    // ResizeObserver loop (warning conhecido do Chrome), DevTools hint, CSP
    // reports informativos, e flakes de rede transient do Supabase auth-js
    // que ocorrem durante refresh de sessão concorrente.
    const errosCriticos = consoleErrors.filter(
      (e) =>
        !e.includes("Hydration") &&
        !e.includes("ResizeObserver") &&
        !e.toLowerCase().includes("download the react devtools") &&
        !e.includes("Content Security Policy") &&
        !e.includes("Failed to fetch") &&
        !e.includes("auth-js")
    );
    expect(errosCriticos, `Erros de console em ${path}: ${errosCriticos.join("\n")}`).toEqual([]);
  });
}

// ===========================================================================
// NAVEGAÇÃO ENTRE PÁGINAS (via Sidebar)
// ===========================================================================

test("sidebar permite navegar entre dashboard e ações", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("h1").first()).toBeVisible();

  // Tenta achar o link "Ações" na sidebar
  const linkAcoes = page.getByRole("link", { name: /ações/i }).first();
  await expect(linkAcoes).toBeVisible();
  await linkAcoes.click();

  await page.waitForURL(/\/dashboard\/acoes/);
  await expect(page.locator("h1").first()).toContainText(/Ações Governamentais/i);
});

// ===========================================================================
// PROTEÇÃO DE ROTAS APÓS LOGOUT
// ===========================================================================

test("após sessão expirar (cookies limpos), rotas protegidas redirecionam", async ({
  page,
  context,
}) => {
  await page.goto("/dashboard");
  await expect(page.locator("h1").first()).toBeVisible();

  await context.clearCookies();
  await page.goto("/dashboard/alertas");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
});
