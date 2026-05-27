# MonitorGov360 — Checklist de Produção

Este documento concentra tudo que precisa ser verificado antes de promover o
MonitorGov360 para produção. Foi gerado ao final da **Fase 8 — Segurança Final
e Testes E2E**.

---

## 🔒 Segurança

### Headers HTTP (configurado em [next.config.ts](next.config.ts))

- [x] `Content-Security-Policy` restritivo (Supabase + Firebase whitelisted)
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [x] `X-Frame-Options: DENY`
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` (camera, geolocation self; microphone off; FLoC off)
- [x] `X-Powered-By` removido

### Rate limiting ([src/middleware.ts](src/middleware.ts) + [src/lib/rate-limit.ts](src/lib/rate-limit.ts))

- [x] 20 tentativas/min/IP em `/login`, `/mfa`, `/primeiro-acesso`
- [x] 10 tentativas/min/IP em `/signup`
- [x] Resposta 429 com header `Retry-After`
- [ ] **Antes de prod com tráfego real:** migrar de memória para Upstash Redis
      ou Vercel KV — o Edge Runtime cria múltiplas instâncias e o estado
      em memória não é compartilhado entre elas.

### Credenciais

- [x] `SUPABASE_SERVICE_ROLE_KEY` usado apenas em [src/lib/supabase/server.ts](src/lib/supabase/server.ts)
- [x] Nenhum client component importa `createAdminClient`
- [x] [.env.example](.env.example) separa claramente `NEXT_PUBLIC_*` de chaves server-only
- [ ] **Antes de prod:** rotacionar `SUPABASE_SERVICE_ROLE_KEY` e
      `FIREBASE_SERVICE_ACCOUNT_BASE64`
- [ ] **Antes de prod:** habilitar 2FA em todos os admins do Supabase, Vercel
      e Firebase
- [ ] Verificar que `.env.local` está no `.gitignore` (e nunca foi commitado)

### Row Level Security

- [x] RLS habilitado em 16 tabelas
- [x] Helper `fn_municipio_id_jwt()` extrai `municipio_id` do JWT
- [x] Helper `fn_usuario_tem_perfil()` para checagens RBAC
- [x] Tabela `auditoria` é imutável (INSERT bloqueado, UPDATE/DELETE = false)
- [x] **Validado por 12 testes automatizados** ([tests/integration/rls-multi-tenant.test.ts](tests/integration/rls-multi-tenant.test.ts))
- [ ] **Antes de prod:** rodar `npm run test:rls` e confirmar 12/12 passed

---

## 🧪 Testes

| Suíte | Comando | Cobertura |
|---|---|---|
| Unit (Vitest) | `npm run test:unit` | Auth helpers, lógica utilitária |
| RLS integração | `npm run test:rls` | 12 testes contra Supabase real |
| E2E smoke | `npm run test:e2e -- tests/e2e/smoke.spec.ts` | 4 testes — infra |
| E2E autenticação | `npm run test:e2e -- tests/e2e/auth.spec.ts` | 10 testes — login/logout/redirects |
| E2E fluxos críticos | `npm run test:e2e -- tests/e2e/fluxos-criticos.spec.ts` | 11 testes — 9 páginas + nav + sessão |
| Tudo (sem E2E) | `npm run test:all` | lint + unit + RLS |
| Tudo (com E2E) | `npm run test:all && npm run test:e2e` | + 25 testes E2E |

**Total automatizado:** 37 testes E2E + 12 RLS + unit tests existentes.

---

## 🚢 Pré-deploy

### Build e qualidade

- [ ] `npm run lint` — sem erros
- [ ] `npm run build` — passa sem warnings de TypeScript
- [ ] `npm run test:all` — tudo verde
- [ ] `npm run test:e2e` — tudo verde

### Configuração Vercel

- [ ] Variáveis de ambiente configuradas em **Production** e **Preview**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_FIREBASE_*` (config Firebase)
  - `FIREBASE_SERVICE_ACCOUNT_BASE64` (server-only)
  - `NEXT_PUBLIC_APP_URL=https://monitorgov360.com.br` (ou domínio real)
- [ ] Domínio customizado configurado com DNS apontando para Vercel
- [ ] HTTPS forçado (Vercel faz por padrão, mas confirmar)
- [ ] Wildcard subdomain (`*.monitorgov360.com.br`) configurado para
      multi-tenant por subdomain

### Supabase

- [ ] Migrations aplicadas: `supabase db push`
- [ ] Auth Hook `customize_jwt_claims` configurado (injeta `municipio_id` no JWT)
- [ ] Storage buckets criados com policies adequadas
- [ ] Backups automáticos habilitados
- [ ] Pool de conexões dimensionado conforme plano

### Firebase

- [ ] Projeto criado em [Firebase Console](https://console.firebase.google.com)
- [ ] Cloud Messaging habilitado
- [ ] Service account JSON gerado e codificado em base64

---

## 📊 Pós-deploy (smoke test)

1. [ ] Acesso à landing page (`/`) carrega
2. [ ] Headers de segurança presentes (verificar via DevTools → Network)
3. [ ] Login com usuário admin redireciona para `/dashboard`
4. [ ] Todas as 9 páginas do dashboard carregam sem erro de console
5. [ ] Push notification chega no celular (testar Firebase)
6. [ ] Tentar acessar `/dashboard` em janela anônima → redireciona para login
7. [ ] Verificar que `/admin@municipio-A.tld` não consegue ver dados de
      `/admin@municipio-B.tld` (teste manual de isolamento)
8. [ ] Logs do Vercel sem erros 500

---

## 🛡️ Pendências para hardening adicional

Itens recomendados mas fora do escopo da Fase 8:

- [ ] **Web Application Firewall:** habilitar Cloudflare ou Vercel Firewall
      Rules para regras de OWASP Core Rule Set.
- [ ] **Penetration test externo:** contratar pentester para revisão
      adversarial antes de servir município real.
- [ ] **Logging centralizado:** integrar Sentry (já tem placeholder em
      [.env.example](.env.example)) ou DataDog para erros do client.
- [ ] **Monitoramento de invariantes:** alertas para spikes de 401/403,
      tentativas de cross-tenant access, falhas de RLS.
- [ ] **CAPTCHA em signup/login:** hCaptcha ou Cloudflare Turnstile para
      bloquear bots antes do rate limit ser atingido.
- [ ] **Rotação periódica de chaves:** automação para rotação trimestral
      de `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **CI/CD:** GitHub Actions que rode `npm run test:all` + E2E em cada PR.

---

**Última atualização:** 2026-05-26 — Fase 8 concluída.
