import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Carrega .env.local antes dos workers iniciarem.
// Os workers herdam process.env do processo principal, então isso é suficiente.
const envPath = resolve(__dirname, ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  // Paralelismo dentro do mesmo arquivo é OK; mas usamos workers=1 globalmente
  // porque os testes criam usuários descartáveis via Supabase Auth Admin, e a
  // criação simultânea por múltiplos workers gera race conditions (JWT
  // propagation, sessões cruzadas). Trade-off: determinismo > velocidade.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? [["html"], ["github"]] : "html",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Bypassa rate limit em ambiente não-prod (ver src/middleware.ts).
    // Necessário porque a suite faz dezenas de logins em paralelo.
    extraHTTPHeaders: {
      "x-e2e-bypass-ratelimit": "1",
    },
  },

  // Em local roda só Chromium (rápido). Em CI roda os 3 navegadores principais.
  projects: isCI
    ? [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
