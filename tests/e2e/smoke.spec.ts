/**
 * Smoke test — valida que a infra E2E está funcionando.
 * Não testa lógica de aplicação, apenas que:
 *  - O dev server responde
 *  - As páginas públicas carregam
 *  - As rotas protegidas redirecionam para login
 *  - Os headers de segurança (Sub-fase 8.1) estão presentes
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke — infra E2E", () => {
  test("landing page (/) carrega com status 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/MonitorGov360|Execução|Governança/i);
  });

  test("página de login carrega e exibe formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("/dashboard sem auth redireciona para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);
  });

  test("headers de segurança estão presentes (Sub-fase 8.1)", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
