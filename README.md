# MonitorGov360

> Do planejamento à entrega real.

Plataforma web para monitoramento e transparência da execução de ações governamentais municipais. Acompanhe obras públicas, programas sociais, ações de saúde e educação com controle de evidências, questionários, alertas e dashboards gerenciais.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5.6+ |
| Estilização | Tailwind CSS 3 + shadcn/ui |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Push Notifications | Firebase Cloud Messaging |
| Estado do Servidor | TanStack Query v5 |
| Estado Global | Zustand v5 |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table v8 |
| Gráficos | Recharts |
| Testes E2E | Playwright |
| Testes Unitários | Vitest + Testing Library |

---

## Pré-requisitos

- Node.js >= 20.x
- npm >= 10.x (ou pnpm/yarn)
- Conta no [Supabase](https://supabase.com)
- Conta no [Firebase](https://console.firebase.google.com) (para notificações push)

---

## Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/monitorgov360.git
cd monitorgov360
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Abra o arquivo `.env.local` e preencha todas as variáveis conforme instruções nos comentários.

### 4. Configure o Supabase

- Crie um novo projeto em [supabase.com](https://supabase.com/dashboard)
- Copie a **URL do projeto** e a **chave anon** para o `.env.local`
- (Opcional) Instale a [Supabase CLI](https://supabase.com/docs/guides/cli) para rodar migrations localmente:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Vincular ao projeto remoto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Verifica problemas de linting |
| `npm run test` | Roda testes unitários (Vitest) |
| `npm run test:e2e` | Roda testes E2E (Playwright) |

---

## Variáveis de Ambiente

Todas as variáveis necessárias estão documentadas no arquivo [`.env.example`](.env.example).

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (servidor) | Chave de serviço do Supabase |
| `NEXT_PUBLIC_FIREBASE_*` | Sim (push) | Configurações do Firebase |
| `NEXT_PUBLIC_APP_URL` | Sim | URL base da aplicação |

---

## Estrutura do Projeto

```
monitorgov360/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/     # Rotas protegidas (painel)
│   │   │   ├── page.tsx     # Dashboard principal
│   │   │   └── layout.tsx
│   │   ├── globals.css      # Estilos globais + CSS variables
│   │   ├── layout.tsx       # Root layout (providers, metadata)
│   │   ├── page.tsx         # Landing page
│   │   └── providers.tsx    # QueryClientProvider
│   ├── components/
│   │   └── ui/              # Componentes shadcn/ui
│   ├── hooks/               # Custom hooks
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts    # Cliente Supabase (browser)
│   │   │   └── server.ts    # Cliente Supabase (server)
│   │   └── utils.ts         # cn(), formatters, etc.
│   ├── middleware.ts         # Proteção de rotas + refresh de sessão
│   ├── server-actions/      # Server Actions do Next.js
│   └── types/
│       ├── index.ts         # Tipos das entidades principais
│       └── database.ts      # Tipos gerados pelo Supabase CLI
├── supabase/
│   ├── migrations/          # Migrations SQL
│   └── functions/           # Edge Functions
├── tests/
│   ├── e2e/                 # Testes Playwright
│   └── unit/                # Testes Vitest
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Perfis de Acesso

O sistema possui 16 perfis hierárquicos:

| Perfil | Descrição |
|---|---|
| `super_admin` | Administrador da plataforma |
| `admin_municipal` | Administrador do município |
| `gestor_secretaria` | Gestor de secretaria |
| `coordenador_obras` | Coordenador de obras públicas |
| `coordenador_social` | Coordenador de programas sociais |
| `coordenador_saude` | Coordenador de saúde |
| `coordenador_educacao` | Coordenador de educação |
| `fiscal_obra` | Fiscal de obra |
| `tecnico_campo` | Técnico de campo |
| `analista` | Analista de dados |
| `controlador_interno` | Controlador interno |
| `vereador` | Vereador |
| `prefeito` | Prefeito |
| `cidadao` | Cidadão (acesso público) |
| `auditor` | Auditor externo |
| `assessor_comunicacao` | Assessor de comunicação |

---

## Tipos de Ações Monitoradas

- Obra Pública
- Serviço de Engenharia
- Programa Social
- Ação de Saúde
- Ação Educacional
- Aquisição de Bens
- Contrato Continuado
- Convênio / Transferência
- Ação Emergencial
- Meta Estratégica
- Reforma
- Pavimentação
- Saneamento
- Habitação
- Cultura e Lazer
- Meio Ambiente

---

## Licença

Proprietário — todos os direitos reservados.

---

*MonitorGov360 &copy; 2025*
