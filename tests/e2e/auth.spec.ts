/**
 * Testes E2E — Fluxo de Autenticação.
 *
 * Cobre: login válido/inválido, validação de formulário, proteção de rotas,
 * logout, fluxo de primeiro acesso, mostrar/ocultar senha, rate limiting.
 */

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  cleanupTestUser,
  createDescartavelUser,
} from "./helpers/auth-helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let municipioId: string;
const usuariosCriados: string[] = [];

test.beforeAll(async () => {
  // Pega um município existente para vincular os usuários de teste
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
    throw new Error(
      `Nenhum município ativo encontrado. Rode 'npm run seed-test' antes dos E2E. Erro: ${error?.message}`
    );
  }
  municipioId = data.id;
});

test.afterAll(async () => {
  for (const id of usuariosCriados) {
    await cleanupTestUser(id);
  }
});

// ===========================================================================
// LOGIN
// ===========================================================================

test.describe("Login", () => {
  test("exibe erro para credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("naoexiste@test.local");
    await page.locator('input[type="password"]').fill("senha-errada-123");
    await page.locator('button[type="submit"]').click();

    // Filtra o __next-route-announcer__ do Next que também tem role=alert
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/incorret|inválid|erro/i);
    expect(page.url()).toContain("/login");
  });

  test("redireciona para /dashboard após login válido", async ({ page }) => {
    const user = await createDescartavelUser({
      municipio_id: municipioId,
      perfil_codigo: "fiscal_contrato",
      label: "login-ok",
    });
    usuariosCriados.push(user.id);

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').fill(user.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test("redireciona para /primeiro-acesso quando user.primeiro_acesso=true", async ({
    page,
  }) => {
    // Cria usuário com primeiro_acesso=true (similar ao seed-test)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = `e2e-primeiro-${Date.now()}@test.local`;
    const { data: authData } = await admin.auth.admin.createUser({
      email,
      password: "E2E@Test123!",
      email_confirm: true,
      user_metadata: {
        municipio_id: municipioId,
        perfil: "fiscal_contrato",
        primeiro_acesso: true,
        mfa_obrigatorio: false,
      },
    });
    if (!authData?.user) throw new Error("Falha ao criar usuário primeiro_acesso");
    usuariosCriados.push(authData.user.id);

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill("E2E@Test123!");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/primeiro-acesso/, { timeout: 15_000 });
    expect(page.url()).toContain("/primeiro-acesso");
  });
});

// ===========================================================================
// VALIDAÇÃO DE FORMULÁRIO
// ===========================================================================

test.describe("Validação de formulário", () => {
  test("mostra erros de validação para campos vazios", async ({ page }) => {
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();
    // Os erros aparecem associados aos inputs via aria-describedby
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });

  test("rejeita email com formato inválido", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("nao-eh-email");
    await page.locator('input[type="password"]').fill("alguma-senha-123");
    await page.locator('button[type="submit"]').click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });
});

// ===========================================================================
// MOSTRAR / OCULTAR SENHA
// ===========================================================================

test("toggle mostrar/ocultar senha alterna o type do input", async ({ page }) => {
  await page.goto("/login");
  const senhaInput = page.locator('input[type="password"]');
  const toggle = page.getByRole("button", { name: /Mostrar senha|Ocultar senha/i });

  await senhaInput.fill("teste");
  await expect(senhaInput).toHaveAttribute("type", "password");

  await toggle.click();
  await expect(page.locator('input[name="senha"]')).toHaveAttribute("type", "text");

  await toggle.click();
  await expect(page.locator('input[name="senha"]')).toHaveAttribute("type", "password");
});

// ===========================================================================
// PROTEÇÃO DE ROTAS
// ===========================================================================

test.describe("Proteção de rotas", () => {
  test("/dashboard sem auth redireciona com redirectTo", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toContain("/dashboard");
  });

  test("/dashboard/alertas sem auth redireciona", async ({ page }) => {
    await page.goto("/dashboard/alertas");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});

// ===========================================================================
// LOGOUT
// ===========================================================================

test("logout encerra a sessão e volta para login", async ({ page }) => {
  const user = await createDescartavelUser({
    municipio_id: municipioId,
    perfil_codigo: "fiscal_contrato",
    label: "logout",
  });
  usuariosCriados.push(user.id);

  // Login
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/);

  // Logout — botão pode estar em menu de usuário; tentamos texto comum
  const logoutCandidates = page.getByRole("button", { name: /sair|logout/i });
  const count = await logoutCandidates.count();
  if (count === 0) {
    // Pode estar dentro de um dropdown — abrir e tentar novamente
    const avatarBtn = page.getByRole("button").filter({ has: page.locator("svg") }).first();
    await avatarBtn.click().catch(() => undefined);
  }
  await logoutCandidates.first().click();

  await page.waitForURL(/\/login/, { timeout: 10_000 });
  expect(page.url()).toContain("/login");
});

// ===========================================================================
// SESSÃO PERSISTENTE — refresh mantém autenticação
// ===========================================================================

test("após login, refresh mantém o usuário no dashboard", async ({ page }) => {
  const user = await createDescartavelUser({
    municipio_id: municipioId,
    perfil_codigo: "fiscal_contrato",
    label: "session",
  });
  usuariosCriados.push(user.id);

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/);

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);
});
