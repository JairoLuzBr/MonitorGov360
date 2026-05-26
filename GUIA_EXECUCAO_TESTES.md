# Guia de Execução de Testes - MonitorGov360 Fase 2

## Quick Start

### Testes Unitários (Recomendado para começar)

```bash
npm run test:unit
```

Resultado esperado:
```
✓ tests/unit/auth.test.ts (18 tests) 36ms
Test Files 1 passed (1)
Tests 18 passed (18)
```

### Testes E2E (Requer servidor rodando)

Terminal 1 - Start dev server:
```bash
npm run dev
```

Terminal 2 - Run E2E tests:
```bash
npm run test:e2e
```

---

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Supabase configurado (para E2E testes com autenticação real)

## Setup Inicial

### 1. Instalar dependências (já feito)

```bash
npm install
npm install --save-dev vitest @playwright/test speakeasy qrcode
```

### 2. Configurar variáveis de ambiente

Para testes E2E com autenticação real, criar `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Testes E2E
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@monitorgov360.test
TEST_USER_PASSWORD=TestPassword123!
```

---

## Execução de Testes

### Testes Unitários

#### Modo padrão (uma vez)
```bash
npm run test:unit
```

#### Modo watch (reexecuta ao salvar)
```bash
npm run test:unit:watch
```

#### Com cobertura de código
```bash
npm run test:unit:coverage
```

#### Teste específico
```bash
npm test -- auth.test.ts
```

#### Teste específico (padrão regex)
```bash
npm test -- --grep "signupUser"
```

### Testes E2E

#### Todos os navegadores (Chromium, Firefox, WebKit, Mobile)
```bash
npm run test:e2e
```

#### Apenas Chromium (mais rápido)
```bash
npx playwright test --project=chromium
```

#### Apenas Firefox
```bash
npx playwright test --project=firefox
```

#### Apenas WebKit
```bash
npx playwright test --project=webkit
```

#### Apenas Mobile Chrome
```bash
npx playwright test --project="Mobile Chrome"
```

#### Interface interativa (UI)
```bash
npm run test:e2e:ui
```

#### Debug mode (com debug tools)
```bash
npm run test:e2e:debug
```

#### Teste específico
```bash
npx playwright test auth.spec.ts
```

#### Com filtro de texto
```bash
npx playwright test -g "login com credenciais"
```

#### Modo headless = false (com browser visível)
```bash
npx playwright test --headed
```

#### Modo headed em um arquivo
```bash
npx playwright test auth.spec.ts --headed
```

---

## Visualizar Relatórios

### Relatório HTML Playwright E2E

Após rodar testes E2E:

```bash
npx playwright show-report
```

Abre relatório HTML com:
- Screenshots de falhas
- Videos de falhas
- Trace viewer
- Detalhes de cada teste

### Cobertura de Código

```bash
npm run test:unit:coverage
open coverage/index.html
```

---

## Troubleshooting

### Problema: Testes E2E timeoutam

**Solução 1:** Certifique-se que o servidor está rodando:
```bash
npm run dev
```

**Solução 2:** Aumente o timeout em `playwright.config.ts`:
```typescript
export default defineConfig({
  use: {
    navigationTimeout: 30000, // 30 segundos
  }
});
```

### Problema: Erro "Cannot find module '@testing-library/dom'"

**Solução:**
```bash
npm install --save-dev @testing-library/dom --legacy-peer-deps
```

### Problema: Erro ao verificar MFA (speakeasy)

**Solução:** Certifique-se que speakeasy está instalado:
```bash
npm install --save-dev speakeasy qrcode
```

### Problema: Playwright browser não found

**Solução:** Instale os browsers:
```bash
npx playwright install
```

### Problema: Porta 3000 já em uso

**Solução 1:** Kill processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Solução 2:** Use porta diferente:
```bash
npm run dev -- -p 3001
```

---

## Estrutura de Testes

```
tests/
├── unit/
│   ├── auth.test.ts          # 18 testes unitários
│   │   ├── signupUser (3)
│   │   ├── signinUser (2)
│   │   ├── getCurrentUser (2)
│   │   ├── signoutUser (2)
│   │   ├── setupMFA (3)
│   │   ├── verifyMFA (4)
│   │   └── Integração (2)
│   └── setup.ts              # Configuração global
│
├── e2e/
│   └── auth.spec.ts          # 11 testes E2E
│       ├── Login/Auth (4)
│       ├── Validação (3)
│       └── UX/Acessibilidade (4)
│
└── README.md                 # Documentação detalhada
```

---

## Casos de Teste

### Unitários (18)

✓ signupUser cria novo usuário  
✓ signupUser com email duplicado  
✓ signupUser passa municipio_id  
✓ signinUser com credenciais válidas  
✓ signinUser com credenciais inválidas  
✓ getCurrentUser autenticado  
✓ getCurrentUser não autenticado  
✓ signoutUser com sucesso  
✓ signoutUser com erro  
✓ setupMFA retorna QR code  
✓ setupMFA retorna secret  
✓ setupMFA trata erro  
✓ verifyMFA código correto  
✓ verifyMFA código inválido  
✓ verifyMFA trata erro  
✓ verifyMFA valida window  
✓ Fluxo completo signup→login  
✓ Fluxo completo MFA setup→verify  

### E2E (11 x 5 navegadores = 55)

✓ Login inválido mostra erro  
✓ Dashboard protegido redireciona  
✓ Login válido funciona  
✓ Validação de campos vazios  
✓ Toggle mostrar/ocultar senha  
✓ Link recuperar senha existe  
✓ Checkbox lembrar-me funciona  
✓ Responsividade mobile  
✓ Logout funciona  
✓ Senha não exibida em plain  
✓ Acessibilidade OK  

---

## Performance

### Testes Unitários
- Setup: ~2s
- Execução: ~36ms
- Total: ~5.8s

### Testes E2E
- Por navegador: ~30-60s
- Todos (5): ~150-300s (2.5-5 min)
- Com UI: ~60-90s

---

## CI/CD Integration

### GitHub Actions

Arquivo `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run build
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### Ao escrever testes

1. **Nomear descritivamente**
   ```typescript
   // Bom
   it('login com email invalido mostra mensagem de erro')
   
   // Ruim
   it('testa login')
   ```

2. **Testar um comportamento por teste**
   ```typescript
   // Bom
   it('mostra erro quando email é inválido')
   it('mostra erro quando senha é inválida')
   
   // Ruim
   it('valida email e senha')
   ```

3. **Usar data-testid para seletores E2E**
   ```typescript
   // Em componentes React
   <input data-testid="email-input" />
   
   // No teste
   page.locator('[data-testid="email-input"]')
   ```

### Ao rodar testes

1. **Sempre rodar antes de push**
   ```bash
   npm run test:unit && npm run build
   ```

2. **Manter testes rápidos**
   - Mock dados externos
   - Não use sleeps
   - Rode em paralelo quando possível

3. **Monitorar coverage**
   ```bash
   npm run test:unit:coverage
   # Aim for >= 80%
   ```

---

## Documentação Adicional

- [`tests/README.md`](./tests/README.md) - Documentação completa de testes
- [`TESTES_FASE2.md`](./TESTES_FASE2.md) - Resumo da Fase 2
- [`RELATORIO_FASE2_FINAL.md`](./RELATORIO_FASE2_FINAL.md) - Relatório final

---

## Dúvidas e Suporte

### Vitest
- Docs: https://vitest.dev
- GitHub: https://github.com/vitest-dev/vitest

### Playwright
- Docs: https://playwright.dev
- GitHub: https://github.com/microsoft/playwright

### Supabase Auth
- Docs: https://supabase.com/docs/guides/auth
- GitHub: https://github.com/supabase/supabase

---

**Last Updated:** 2026-05-26  
**Version:** 1.0  
**Mantainer:** Agente AT — Testes
