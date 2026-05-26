# Testes Fase 2 - MonitorGov360

## Status: INICIADO

**Data:** 2026-05-26  
**Agente:** AT — Testes  
**Objetivo:** Criar e validar testes para o sistema de autenticação A3

---

## Resumo de Criação

### Testes Unitários (Vitest)

#### Arquivo criado: `tests/unit/auth.test.ts`

**Total de testes criados: 18**

Estrutura:
- **signupUser** - 3 testes
  - Cria novo usuário com email válido ✓
  - Retorna erro se email já existe ✓
  - Valida que municipio_id é passado corretamente ✓

- **signinUser** - 2 testes
  - Faz login com credenciais corretas ✓
  - Retorna erro com credenciais inválidas ✓

- **getCurrentUser** - 2 testes
  - Retorna usuário autenticado ✓
  - Retorna null se usuário não autenticado ✓

- **signoutUser** - 2 testes
  - Faz logout e limpa sessão ✓
  - Retorna erro se logout falha ✓

- **setupMFA** - 3 testes
  - Retorna QR code válido (base64) ✓
  - Retorna secret em base32 ✓
  - Trata erro ao gerar QR code ✓

- **verifyMFA** - 4 testes
  - Valida código TOTP correto ✓
  - Rejeita código TOTP inválido ✓
  - Trata erro ao verificar TOTP ✓
  - Valida janela de token (window) ✓

- **Cenários de Integração** - 2 testes
  - Fluxo: signup → getUser → signout ✓
  - Fluxo: MFA setup → verify ✓

**Status: 18/18 PASSANDO**

---

### Testes E2E (Playwright)

#### Arquivo criado: `tests/e2e/auth.spec.ts`

**Total de testes criados: 11**

Estrutura:
1. Login com credenciais inválidas mostra erro
2. Rota /dashboard protegida sem autenticação redireciona para login
3. Login com credenciais válidas redireciona para dashboard
4. Formulário de login valida campos vazios
5. Botão de mostrar/ocultar senha funciona
6. Link de recuperação de senha está acessível
7. Checkbox "manter-me conectado" pode ser marcado
8. Página de login é responsiva em mobile
9. Logout remove sessão e redireciona para login
10. Campo de senha não exibe texto em plain quando não expandido
11. Página de login segue padrões de acessibilidade

**Cobertura multi-navegador:**
- Chromium
- Firefox
- WebKit
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**Total de testes E2E (considerando todos os navegadores): 55**

---

## Arquivos Criados

### Core
- `src/lib/auth/helpers.ts` - Helpers de autenticação com Supabase
  - signupUser()
  - signinUser()
  - getCurrentUser()
  - signoutUser()
  - setupMFA()
  - verifyMFA()

### Testes
- `tests/unit/auth.test.ts` - 18 testes unitários (Vitest)
- `tests/e2e/auth.spec.ts` - 11 testes E2E (Playwright)
- `tests/setup.ts` - Configuração global de testes
- `tests/README.md` - Documentação de testes

### Configuração
- `vitest.config.ts` - Configuração do Vitest
- `playwright.config.ts` - Configuração do Playwright
- `.env.test` - Variáveis de ambiente para testes

---

## Dependências Instaladas

```bash
npm install --save-dev speakeasy qrcode msw
npm install --save-dev @vitest/coverage-v8 @vitest/ui
npm install --save-dev jsdom @testing-library/dom
```

Packages adicionados:
- `speakeasy` ^2.0.0 - TOTP generation/verification
- `qrcode` ^1.5.4 - QR code generation
- `msw` ^2.14.6 - Mock Service Worker
- `vitest` ^2.1.0 - Unit testing
- `@playwright/test` ^1.60.0 - E2E testing
- `jsdom` - DOM environment para testes

---

## Resultado dos Testes Unitários

### Execução

```bash
npm run test:unit
```

**Status: ✓ TODOS OS 18 TESTES PASSANDO**

```
 ✓ tests/unit/auth.test.ts (18 tests) 36ms

Test Files 1 passed (1)
    Tests 18 passed (18)
Start at 09:54:11
Duration 5.82s
```

### Testes Passando

1. ✓ signupUser cria novo usuário com email válido
2. ✓ signupUser retorna erro se email já existe
3. ✓ signupUser valida que municipio_id é passado corretamente
4. ✓ signinUser faz login com credenciais corretas
5. ✓ signinUser retorna erro com credenciais inválidas
6. ✓ getCurrentUser retorna usuário autenticado
7. ✓ getCurrentUser retorna null se usuário não autenticado
8. ✓ signoutUser faz logout e limpa sessão
9. ✓ signoutUser retorna erro se logout falha
10. ✓ setupMFA retorna QR code válido (base64)
11. ✓ setupMFA retorna secret em base32
12. ✓ setupMFA trata erro ao gerar QR code
13. ✓ verifyMFA valida código TOTP correto
14. ✓ verifyMFA rejeita código TOTP inválido
15. ✓ verifyMFA trata erro ao verificar TOTP
16. ✓ verifyMFA valida janela de token (window)
17. ✓ Fluxo: signup → getUser → signout
18. ✓ Fluxo: MFA setup → verify

---

## Resultado dos Testes E2E

### Testes Descobertos pelo Playwright

```bash
npx playwright test --list
```

**Status: ✓ 55 TESTES DESCOBERTOS**

- 11 testes por navegador
- 5 navegadores/dispositivos

### Configuração

Arquivo `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Retries: 0 em dev, 2 em CI
- Reporters: HTML
- Screenshots: only-on-failure
- Videos: retain-on-failure

---

## Comandos de Execução

### Testes Unitários

```bash
# Executa testes unitários uma vez
npm run test:unit

# Modo watch
npm run test:unit:watch

# Com cobertura (em desenvolvimento)
npm run test:unit:coverage

# Padrão específico
npm test -- auth.test.ts
```

### Testes E2E

```bash
# Todos os navegadores (5 navegadores x 11 testes = 55 testes)
npm run test:e2e

# Apenas Chromium
npx playwright test --project=chromium

# Interface interativa
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Listar testes
npx playwright test --list

# Ver relatório
npx playwright show-report
```

---

## Mocks e Configuração

### Mocks Unitários

- **@/lib/supabase/client** - Mock completo
  - auth.signUp()
  - auth.signInWithPassword()
  - auth.getUser()
  - auth.signOut()

- **speakeasy** - Mock para TOTP
  - generateSecret()
  - totp.verify()

- **qrcode** - Mock para QR code
  - toDataURL()

### Setup Global

- localStorage mock
- sessionStorage mock
- Variáveis de ambiente
- React Testing Library cleanup

---

## Próximos Passos (Recomendações)

### Curto Prazo
1. Executar testes E2E contra servidor real
2. Validar cobertura de código (>80%)
3. Integrar com CI/CD pipeline
4. Criar usuários de teste no Supabase

### Médio Prazo
1. Adicionar testes para fluxo completo de signup
2. Adicionar testes para recuperação de senha
3. Adicionar testes para MFA com QR code scanning
4. Adicionar testes de performance

### Longo Prazo
1. Visual regression tests
2. Testes de segurança (OWASP)
3. Testes de load
4. Testes de compatibilidade com navegadores antigos

---

## Notas Técnicas

### Desafios Encontrados

1. **Versão do coverage** - @vitest/coverage-v8 tem conflito com vitest 2.1.9
   - Solução: Comentar coverage por enquanto
   - Próximo passo: Atualizar dependências

2. **Missing dependencies**
   - jsdom não instalado automaticamente
   - @testing-library/dom não instalado automaticamente
   - Solução: Instalar com --legacy-peer-deps

### Arquitetura de Testes

```
tests/
├── unit/
│   ├── auth.test.ts (18 testes)
│   └── setup.ts
├── e2e/
│   └── auth.spec.ts (11 testes)
└── README.md

Helpers:
src/lib/auth/helpers.ts (6 funções)
```

---

## Validation Checklist

- [x] Testes unitários criados
- [x] Testes E2E criados
- [x] Todos os testes unitários passando
- [x] Testes E2E descobertos e configurados
- [x] Mocks e setup configurados
- [x] Documentação criada
- [x] Comandos npm configurados
- [ ] Cobertura >= 80% (bloqueado por versão)
- [ ] Testes E2E executados com sucesso (em andamento)
- [ ] Integrado com CI/CD (próximo passo)

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| Testes Unitários | 18 |
| Testes E2E | 11 |
| Testes E2E (multi-browser) | 55 |
| Total de Testes | 73 |
| Taxa de Sucesso (Unit) | 100% (18/18) |
| Taxa de Sucesso (E2E) | Pendente |
| Linhas de Código (Testes) | 520+ |
| Linhas de Código (Helpers) | 100+ |
| Cobertura | Pendente |

---

**Atualizado em:** 2026-05-26  
**Próxima revisão:** Após execução completa dos testes E2E
