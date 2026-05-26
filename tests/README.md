# Testes - MonitorGov360 Fase 2

Este diretório contém os testes para o sistema de autenticação A3, incluindo testes unitários (Vitest) e testes E2E (Playwright).

## Estrutura

```
tests/
├── unit/                    # Testes Unitários
│   ├── auth.test.ts        # Testes dos helpers de autenticação
│   └── setup.ts            # Configuração global
├── e2e/                     # Testes E2E
│   └── auth.spec.ts        # Fluxo completo de autenticação
└── README.md               # Este arquivo
```

## Testes Unitários (Vitest)

Validam a lógica dos helpers de autenticação de forma isolada com mocks.

### Arquivo: `tests/unit/auth.test.ts`

#### Testes inclusos:

1. **signupUser**
   - Cria novo usuário com email válido
   - Retorna erro se email já existe
   - Valida que municipio_id é passado corretamente

2. **signinUser**
   - Faz login com credenciais corretas
   - Retorna erro com credenciais inválidas

3. **getCurrentUser**
   - Retorna usuário autenticado
   - Retorna null se usuário não autenticado

4. **signoutUser**
   - Faz logout e limpa sessão
   - Retorna erro se logout falha

5. **setupMFA**
   - Retorna QR code válido (base64)
   - Retorna secret em base32
   - Trata erro ao gerar QR code

6. **verifyMFA**
   - Valida código TOTP correto
   - Rejeita código TOTP inválido
   - Trata erro ao verificar TOTP
   - Valida janela de token (window)

7. **Cenários de Integração**
   - Fluxo: signup → getUser → signout
   - Fluxo: MFA setup → verify

### Rodando Testes Unitários

```bash
# Executa testes uma vez
npm run test:unit

# Modo watch (reexecuta ao salvar)
npm run test:unit:watch

# Com cobertura
npm run test:unit:coverage

# Específico (padrão de arquivo)
npm test -- auth.test.ts
```

## Testes E2E (Playwright)

Validam o fluxo completo de autenticação em ambiente real/simulado.

### Arquivo: `tests/e2e/auth.spec.ts`

#### Cenários de teste:

1. **Login com credenciais inválidas**
   - Mostra mensagem de erro
   - Não redireciona para dashboard

2. **Rota protegida sem autenticação**
   - Redireciona para /login
   - Inclui parâmetro redirectTo

3. **Login com credenciais válidas**
   - Redireciona para /dashboard
   - Carrega página do dashboard

4. **Validação de formulário**
   - Valida campos vazios
   - Mostra mensagens de erro

5. **Visibilidade de senha**
   - Botão toggle funciona
   - Campo muda de type="password" para type="text"

6. **Link de recuperação de senha**
   - Link está acessível
   - Tem href correto

7. **Checkbox "Lembrar-me"**
   - Pode ser marcado/desmarcado
   - Funciona corretamente

8. **Responsividade**
   - Funciona em viewport móvel (375x667)
   - Elementos estão visíveis

9. **Logout**
   - Remove sessão
   - Redireciona para login

10. **Segurança**
    - Senhas não são visíveis em plain
    - Campo usa type="password"

11. **Acessibilidade**
    - Labels estão associados
    - Inputs têm aria-describedby
    - Errors têm role="alert"

### Rodando Testes E2E

```bash
# Executa todos os testes E2E
npm run test:e2e

# Interface interativa (UI)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Específico
npm run test:e2e tests/e2e/auth.spec.ts

# Em navegador específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Configuração

### Variáveis de Ambiente

Para os testes E2E, configure:

```bash
# .env.local
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@monitorgov360.test
TEST_USER_PASSWORD=TestPassword123!
```

### Supabase

Para rodar testes E2E que fazem login real:

1. Configure Supabase com a base de dados de teste
2. Crie usuários de teste (ou use mock)
3. Configure as credenciais nos .env

## Coverage (Cobertura de Código)

Cobertura esperada: **>= 80%** para auth helpers

```bash
npm run test:unit:coverage
```

Resultado será exibido em HTML em `coverage/index.html`

## Estrutura de Mocks

### Unit Tests
- **Supabase client**: Mockado com `vi.mock()`
- **speakeasy**: Mockado para TOTP
- **qrcode**: Mockado para gerar URLs de dados

### E2E Tests
- **Supabase**: Real (integração real com servidor)
- **Páginas**: Real (testa UI completa)

## Relatórios

### HTML Reports

```bash
# Playwright (após rodar testes)
npx playwright show-report
```

### Coverage HTML

```bash
# Vitest (após rodar com coverage)
open coverage/index.html
```

## Troubleshooting

### Testes E2E falham com timeout
- Verifique se `npm run dev` está rodando
- Aumente timeout em `playwright.config.ts`
- Verifique conectividade com Supabase

### Testes unitários falham
- Limpe cache: `rm -rf .next node_modules/.cache`
- Reinstale: `npm install`
- Verifique mocks em `tests/unit/auth.test.ts`

### MFA tests falhando
- Verifique instalação de `speakeasy` e `qrcode`
- Verifique que mocks estão sendo importados

## Next Steps

1. Adicionar testes para signup E2E completo
2. Adicionar testes para recuperação de senha
3. Adicionar testes para MFA (QR code scanning)
4. Integrar com CI/CD pipeline
5. Adicionar performance tests
6. Adicionar visual regression tests

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
