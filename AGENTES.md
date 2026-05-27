# MonitorGov360 — Agentes Especializados

Documento de referência com todos os agentes do projeto, suas habilidades e responsabilidades.

---

## 📋 Visão Geral

O projeto MonitorGov360 utiliza agentes especializados em paralelo para acelerar o desenvolvimento. Cada agente tem um escopo claro e expertise em uma área específica.

### Agentes de Construção (Implementam features)
- **A1** — Agente Arquiteto
- **A2** — Agente de Banco de Dados
- **A3** — Agente de Autenticação
- **A4** — Agente de Dashboard
- **A5** — Agente de Questionários
- **A6** — Agente de Evidências
- **A7** — Agente de Orçamento
- **A8** — Agente de Alertas
- **A9** — Agente Mobile (Fase 2)

### Agentes de Suporte (Acompanham todo o processo)
- **AT** — Agente de Testes
- **AV** — Agente de Frontend Visual
- **AS** — Agente de Segurança
- **AG** — Agente Guia

---

## 🏗️ AGENTE A1 — Arquiteto

**Responsabilidade:** Scaffold inicial, configurações, estrutura do projeto, deploy Vercel

**Habilidades:**
- ✅ Criar `package.json` com dependências corretas
- ✅ Configurar `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- ✅ Montar estrutura de pastas (`src/app`, `src/lib`, `src/components`, etc.)
- ✅ Criar `vercel.json` para deploy na Vercel
- ✅ Gerar `.env.example` e `.gitignore`
- ✅ Criar landing page e layout root
- ✅ Montar Supabase clients (browser e server)
- ✅ Configurar middleware Next.js

**Entrega na Fase 1:**
```
✓ package.json com 50+ dependências
✓ 27 arquivos de configuração e estrutura
✓ Deploy funcional na Vercel
✓ Build passa sem erros TypeScript
```

**Próxima aparição:** Fase 5+ (otimizações de build, bundle size)

---

## 🗄️ AGENTE A2 — Banco de Dados

**Responsabilidade:** Schema multi-tenant, migrações SQL, RLS policies, RBAC, funções SQL

**Habilidades:**
- ✅ Criar schema PostgreSQL completo (16 tabelas)
- ✅ Implementar isolamento multi-tenant via `municipio_id`
- ✅ Escrever RLS policies para cada tabela (SELECT, INSERT, UPDATE, DELETE)
- ✅ Criar 16 perfis com permissões granulares
- ✅ Seed de dados de teste (município demo, usuários, ações)
- ✅ Implementar funções SQL (auditoria, alertas, cálculos, cronjobs)
- ✅ Criar índices e constraints
- ✅ Escrever triggers para updated_at automático

**Entrega na Fase 1:**
```
✓ 001_initial_schema.sql (16 tabelas + índices)
✓ 002_rls_policies.sql (RLS + políticas por perfil)
✓ 003_seed_perfis.sql (16 perfis + dados demo)
✓ 004_functions.sql (auditoria, alertas, questionários)
```

**Próxima aparição:** Fase 4+ (novas tabelas para features específicas)

---

## 🔐 AGENTE A3 — Autenticação

**Responsabilidade:** Supabase Auth, MFA, perfis, JWT custom claims, middleware tenant

**Habilidades:**
- ✅ Implementar login/logout com Supabase Auth
- ✅ Criar tela de MFA (TOTP) com QR code
- ✅ Adicionar custom JWT claims (municipio_id, perfil, permissoes)
- ✅ Implementar primeiro acesso / cadastro de usuário
- ✅ Middleware para isolamento de tenant por subdomínio
- ✅ Proteção de rotas autenticadas
- ✅ Refresh automático de sessão
- ✅ Logout e limpeza de cookies

**Entrega na Fase 2:**
```
✓ src/app/(auth)/login/page.tsx
✓ src/app/(auth)/mfa/page.tsx
✓ src/app/(auth)/primeiro-acesso/page.tsx
✓ Middleware atualizado para tenant isolation
✓ JWT com custom claims funcionando
```

**Próxima aparição:** Fase 6+ (SSO, OAuth providers)

---

## 📊 AGENTE A4 — Dashboard

**Responsabilidade:** BI panels por perfil com Tremor, KPIs, gráficos, indicadores

**Habilidades:**
- ✅ Criar 6 dashboards diferentes (Prefeito, Secretário, Gestor, Auditor, Obras, Sociais)
- ✅ Montar cards de KPI com Tremor
- ✅ Implementar gráficos com Recharts (execução, orçamento, tendências)
- ✅ Criar tabelas com TanStack React Table
- ✅ Conectar dashboards ao banco via queries Supabase
- ✅ Atualização em tempo real via Supabase Realtime
- ✅ Filters e drill-down por órgão/período

**Entrega na Fase 3:**
```
✓ src/components/dashboard/prefeito/
✓ src/components/dashboard/secretario/
✓ src/components/dashboard/controle-interno/
✓ src/components/dashboard/gestor/
✓ src/components/dashboard/painel-obras/
✓ src/components/dashboard/programas-sociais/
```

**Próxima aparição:** Fase 4+ (novos KPIs, exportação de relatórios)

---

## 📋 AGENTE A5 — Questionários

**Responsabilidade:** Sistema de questionários semanais automáticos, ciclos, respostas

**Habilidades:**
- ✅ Criar Supabase Edge Function para disparo automático (cron)
- ✅ Implementar geração de ciclos (semanal/quinzenal/mensal)
- ✅ Montar formulário dinâmico (React Hook Form + Zod)
- ✅ Reaproveitamento de respostas do ciclo anterior
- ✅ Interface mobile-first
- ✅ Upload de evidências durante resposta
- ✅ Notificação FCM quando questinário disponível
- ✅ Controle de prazo e alertas de atraso

**Entrega na Fase 4:**
```
✓ supabase/functions/disparar-questionarios/index.ts
✓ src/app/(dashboard)/questionarios/page.tsx
✓ src/components/questionarios/formulario-dinamico.tsx
✓ Ciclos automáticos funcionando
```

**Próxima aparição:** Fase 5+ (templates customizados por município)

---

## 📸 AGENTE A6 — Evidências

**Responsabilidade:** Upload fotos/docs, geolocalização, storage Supabase, processamento

**Habilidades:**
- ✅ Criar componente de upload de fotos (drag-and-drop)
- ✅ Compressão de imagens automática (browser-image-compression)
- ✅ Captura de geolocalização do navegador
- ✅ Upload para Supabase Storage com RLS
- ✅ Suporte para múltiplos tipos (foto, documento, vídeo, link, laudo)
- ✅ Vinculação automática à ação correta
- ✅ Geração de thumbnails
- ✅ Trilha de auditoria completa

**Entrega na Fase 5:**
```
✓ src/app/(dashboard)/evidencias/page.tsx
✓ src/components/evidencias/upload-evidencia.tsx
✓ supabase/functions/processar-evidencia/index.ts
✓ Storage Supabase configurado com RLS
```

**Próxima aparição:** Fase 6+ (reconhecimento de imagem, OCR de documentos)

---

## 💰 AGENTE A7 — Orçamento

**Responsabilidade:** Integração LOA, empenhos, liquidações, pagamentos

**Habilidades:**
- ✅ Importação via API ou CSV (LOA, dotações, empenhos)
- ✅ Validação automática de dados
- ✅ Vinculação às ações monitoradas
- ✅ Painel de execução orçamentária
- ✅ Cálculo de divergência físico-financeira
- ✅ Alertas de variação > threshold
- ✅ Relatórios de execução por programa
- ✅ Previsão de saldo

**Entrega na Fase 5:**
```
✓ src/app/(dashboard)/orcamento/page.tsx
✓ src/components/orcamento/importador.tsx
✓ supabase/functions/importar-orcamento/index.ts
✓ Integração com sistema contábil (API)
```

**Próxima aparição:** Fase 6+ (integração automática com SIAFEM, Planalto)

---

## 🚨 AGENTE A8 — Alertas

**Responsabilidade:** Cruzamento de dados, alertas automáticos, divergências, FCM

**Habilidades:**
- ✅ Detectar obras paradas (>30 dias sem progresso)
- ✅ Alertar questionários em atraso
- ✅ Identificar divergências físico-financeiras
- ✅ Detectar omissões de responsáveis
- ✅ Alertar contratos vencendo
- ✅ Escalonamento de alertas (gestor → secretário → prefeito)
- ✅ Integração com Firebase FCM para push notifications
- ✅ Supabase Realtime para dashboard em tempo real

**Entrega na Fase 6:**
```
✓ supabase/functions/gerar-alertas/index.ts
✓ supabase/functions/enviar-notificacoes-fcm/index.ts
✓ src/app/(dashboard)/alertas/page.tsx
✓ Alertas em tempo real no dashboard
```

**Próxima aparição:** Fase 7+ (ML para detecção de anomalias)

---

## 📱 AGENTE A9 — Mobile

**Responsabilidade:** App Expo React Native (Fase 2 do projeto)

**Habilidades:**
- ✅ Scaffold Expo project
- ✅ Autenticação Supabase no mobile
- ✅ Tela de questionários mobile-first
- ✅ Captura de foto + geolocalização
- ✅ Upload de evidências
- ✅ Push notifications (Expo + FCM)
- ✅ Navegação por perfil
- ✅ Offline-first com Supabase

**Status:** ⏳ Adiado para Fase 2 (pós-web)

---

## ✅ AGENTE AT — Testes

**Responsabilidade:** Validar cada etapa (unit, E2E, integração)

**Habilidades:**
- ✅ Testes Vitest (funções utilitárias, hooks)
- ✅ Testes E2E Playwright (fluxo completo)
- ✅ Testes de RLS (via cliente Supabase, não SQL editor)
- ✅ Testes de isolamento multi-tenant
- ✅ Verificação de build (sem erros TypeScript)
- ✅ Verificação de deploy (Vercel funcionando)
- ✅ Cobertura de testes

**Checklist por Fase:**
- **Fase 1:** Build passa, RLS testado, deploy funcional
- **Fase 2:** Login/logout funciona, MFA testado, tenant isolation verificado
- **Fase 3:** Dashboards renderizam, dados aparecem corretos
- **Fase 4:** Questionários disparam, respostas salvam
- **Fase 5:** Upload de evidências, orçamento importado
- **Fase 6:** Alertas disparam, FCM funciona
- **Fase 8:** Testes E2E completos (Playwright)

---

## 🎨 AGENTE AV — Frontend Visual

**Responsabilidade:** Renderizar UI atual para visualização do progresso

**Habilidades:**
- ✅ Tirar screenshots do projeto em desenvolvimento
- ✅ Verificar responsividade (desktop/tablet/mobile)
- ✅ Validar identidade visual (cores, tipografia, spacing)
- ✅ Confirmar acessibilidade (contraste, focus states)
- ✅ Testar interações (hover, active, disabled states)
- ✅ Validar consistency entre páginas

**Deliverables por Fase:**
- **Fase 1:** Landing page + tela de login
- **Fase 2:** Telas de auth (login, MFA, primeiro acesso)
- **Fase 3:** Dashboards por perfil
- **Fase 4:** Telas de questionários
- **Fase 5:** Upload de evidências, painel orçamentário
- **Fase 6:** Alertas em tempo real

---

## 🔒 AGENTE AS — Segurança

**Responsabilidade:** OWASP, RLS audit, pen-test, correção de falhas

**Habilidades:**
- ✅ OWASP Top 10 scanning
- ✅ Testes de SQL injection
- ✅ Verificação de RLS (isolamento multi-tenant)
- ✅ Testes de escalada de privilégios
- ✅ Teste de força bruta
- ✅ Verificação de data leakage entre tenants
- ✅ Audit trail imutável
- ✅ Service role key nunca exposta no cliente

**Checklist por Fase:**
- **Fase 2:** Auth seguro, MFA funcionando, tenant isolation
- **Fase 3:** RLS policies testadas em todas as tabelas
- **Fase 4:** Questionários isolados por tenant
- **Fase 5:** Upload de evidências com validações
- **Fase 6:** Alertas não vazam dados entre tenants
- **Fase 8:** Penetration test completo

---

## 🧑‍🏫 AGENTE AG — Guia

**Responsabilidade:** Orientar usuário iniciante em vibe code passo a passo

**Habilidades:**
- ✅ Explicar cada ferramenta/plataforma (Supabase, Vercel, Firebase)
- ✅ Guias passo a passo com screenshots descritos
- ✅ Checklists visuais
- ✅ Troubleshooting de erros comuns
- ✅ Explicações de conceitos (RLS, multi-tenant, JWT, etc.)
- ✅ Orientação em vibe code (quando usar Agent, Glob, Grep, etc.)

**Deliverables:**
- ✅ Guia de configuração plataformas (Fase 1)
- ⏳ Guia de autenticação (Fase 2)
- ⏳ Guia de dashboards (Fase 3)
- ⏳ Guia de testes (Fase 8)

---

## 🔄 Execução por Fase

### Fase 1 — Fundação (CONCLUÍDA)
```
[A1 + A2] em paralelo
  ↓
AT — valida build, RLS, deploy
  ↓
AG — orienta configuração
```

### Fase 2 — Autenticação (PRÓXIMA)
```
[A3 + AS] em paralelo
  ↓
AT — valida login, MFA, isolamento
  ↓
AV — renderiza telas de auth
  ↓
AG — guia de uso
```

### Fase 3 — Dashboards
```
A4 — cria 6 dashboards
  ↓
AT — valida dados e renderização
  ↓
AV — verifica design e UX
  ↓
AS — auditoria RLS nas queries
```

### Fase 4 — Questionários
```
A5 — cria sistema de questionários
  ↓
AT — valida ciclos e respostas
  ↓
AS — auditoria isolamento
```

### Fase 5 — Evidências + Orçamento
```
[A6 + A7] em paralelo
  ↓
AT — valida uploads e imports
  ↓
AV — renderiza interfaces
```

### Fase 6 — Alertas
```
A8 — cria sistema de alertas
  ↓
AT — valida FCM e Realtime
  ↓
AS — auditoria data leakage
```

### Fase 8 — Segurança Final ✅ CONCLUÍDA
```
[AS + AT] em paralelo
  ↓
Security review completo
  ↓
Testes E2E Playwright
```

**Entregas:**
- Headers HTTP de segurança ([next.config.ts](next.config.ts)): CSP, HSTS,
  X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Rate limiting em rotas de autenticação ([src/lib/rate-limit.ts](src/lib/rate-limit.ts))
- 12 testes RLS validando isolamento multi-tenant contra Supabase real
  ([tests/integration/rls-multi-tenant.test.ts](tests/integration/rls-multi-tenant.test.ts))
- 25 testes E2E Playwright cobrindo: infra, autenticação (login/MFA/primeiro
  acesso/logout) e fluxos críticos (9 páginas do dashboard + navegação)
- Checklist de produção em [PRODUCAO.md](PRODUCAO.md)

---

## 📞 Como Chamar Agentes

Para chamar um agente em uma próxima conversa, use este padrão:

```
Agent({
  description: "A3 — Implementar autenticação com Supabase",
  prompt: "[prompt detalhado com contexto]",
  isolation: "worktree"  // opcional, cria branch temporário
})
```

**Exemplo real:**
```typescript
Agent({
  description: "A3 — Supabase Auth + MFA + JWT custom claims",
  prompt: `
    Você é o Agente A3 — Autenticação.
    Implementar em MonitorGov360:
    1. Login com email/senha via Supabase Auth
    2. MFA TOTP para perfis críticos (prefeito, controle_interno)
    3. Custom JWT claims: { municipio_id, perfil, orgao_id, permissoes }
    4. Middleware para isolamento de tenant por subdomínio
    
    Criar arquivos em src/app/(auth)/:
    - login/page.tsx (formulário de login)
    - mfa/page.tsx (tela TOTP com QR code)
    - primeiro-acesso/page.tsx (cadastro de novo usuário)
    
    Usar: react-hook-form, zod, speakeasy, qrcode.react
    ...
  `,
  isolation: "worktree"
})
```

---

## 📚 Referência Rápida

| Agente | Fase | Especialidade | Status |
|--------|------|---------------|--------|
| A1 | 1 | Scaffold, configs | ✅ Concluído |
| A2 | 1 | DB schema, SQL, RLS | ✅ Concluído |
| A3 | 2 | Auth, MFA, JWT | ✅ Concluído |
| A4 | 3 | Dashboards, KPI | ✅ Concluído |
| A5 | 4 | Questionários, cron | ✅ Concluído |
| A6 | 5 | Evidências, upload | ✅ Concluído |
| A7 | 5 | Orçamento, integração | ✅ Concluído |
| A8 | 6 | Alertas, FCM | ✅ Concluído |
| A9 | 2+ | Mobile, Expo | ⏳ Adiado |
| AT | 8 | Testes, validação | ✅ Concluído |
| AV | Todas | Visual, UI/UX | ⏳ Contínuo |
| AS | 8 | Segurança, RLS | ✅ Concluído |
| AG | Todas | Orientação, guias | ⏳ Contínuo |

---

## 💡 Dicas de Uso

1. **Sempre descreva o contexto** — Os agentes trabalham melhor quando sabem exatamente o escopo
2. **Use `isolation: "worktree"`** — Para features grandes, cria uma branch temporária segura
3. **Encadeie agentes** — A3 cria auth, depois AT testa, depois AS audita
4. **Revise o resultado** — Sempre verifique os arquivos criados antes de fazer push
5. **Aproveite nomes** — Cada agente tem um "nome de herói" para facilitar referência

---

## 🎯 Próximos Passos

**Agora:** Fases 1–8 concluídas. Plataforma pronta para deploy em produção.

**Antes do go-live:** seguir o [PRODUCAO.md](PRODUCAO.md) — checklist completo
de configuração Vercel, Supabase, Firebase + smoke test pós-deploy.

**Pendências reconhecidas:**
- Mobile (A9 — Expo React Native) — adiado para pós-web
- Pentest externo, WAF, CAPTCHA, CI/CD — listados em [PRODUCAO.md](PRODUCAO.md)
  como hardening adicional

---

**Documento gerado em:** 2026-05-26  
**Versão:** 1.0  
**Stack:** Next.js 15 + Supabase + Vercel + Firebase
