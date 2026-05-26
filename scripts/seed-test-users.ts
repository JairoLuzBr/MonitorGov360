/**
 * Cria 4 usuários de teste — um para cada perfil de painel.
 * Executa: npm run seed-perfis
 *
 * Após rodar, faça login em http://localhost:3000/login com:
 *   prefeito@test.com   / Teste@123  → Painel Prefeito
 *   secretario@test.com / Teste@123  → Painel Secretário
 *   controle@test.com   / Teste@123  → Painel Controle Interno
 *   fiscal@test.com     / Teste@123  → Painel Fiscal/Servidor
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = value.join("=").trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface Perfil {
  email: string;
  perfil: string;
  nome: string;
  emoji: string;
}

const PERFIS: Perfil[] = [
  { email: "prefeito@test.com",   perfil: "prefeito",         nome: "Prefeito",         emoji: "👔" },
  { email: "secretario@test.com", perfil: "secretario",       nome: "Secretário",       emoji: "🏛️" },
  { email: "controle@test.com",   perfil: "controle_interno", nome: "Controle Interno", emoji: "🛡️" },
  { email: "fiscal@test.com",     perfil: "fiscal",           nome: "Fiscal",           emoji: "👷" },
];

async function seed() {
  console.log("🌱 Criando usuários de teste para cada perfil...\n");

  // 1. Busca município existente
  const { data: municipios, error: errMun } = await supabase
    .from("municipios")
    .select("id, nome")
    .limit(1);

  if (errMun || !municipios?.length) {
    console.error("❌ Nenhum município encontrado na tabela");
    process.exit(1);
  }

  const municipio = municipios[0];
  console.log(`📍 Município: ${municipio.nome} (${municipio.id})\n`);

  // 2. Para cada perfil, cria ou atualiza usuário
  for (const p of PERFIS) {
    process.stdout.write(`${p.emoji} ${p.nome.padEnd(20)} (${p.email.padEnd(25)}) ... `);

    // Tenta criar usuário novo
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: p.email,
      password: "Teste@123",
      email_confirm: true,
      user_metadata: {
        municipio_id: municipio.id,
        perfil: p.perfil,
        primeiro_acesso: false, // já criado pronto, sem precisar de primeiro acesso
        mfa_obrigatorio: false, // facilitar teste — sem MFA
        mfa_verificado: false,
      },
    });

    if (created?.user) {
      console.log("✅ criado");
      continue;
    }

    // Se já existe, atualiza metadata para garantir perfil correto
    if (createErr?.message.includes("already")) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users.find((u) => u.email === p.email);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password: "Teste@123",
          user_metadata: {
            municipio_id: municipio.id,
            perfil: p.perfil,
            primeiro_acesso: false,
            mfa_obrigatorio: false,
            mfa_verificado: false,
          },
        });
        console.log("✅ atualizado");
        continue;
      }
    }

    console.log(`❌ ${createErr?.message || "erro desconhecido"}`);
  }

  console.log("\n✨ Pronto! Faça login em http://localhost:3000/login\n");
  console.log("Senha de todos: Teste@123\n");
  console.log("┌─────────────────────────────┬──────────────────────┐");
  console.log("│ Email                       │ Painel               │");
  console.log("├─────────────────────────────┼──────────────────────┤");
  for (const p of PERFIS) {
    console.log(`│ ${p.email.padEnd(28)}│ ${p.emoji}  ${p.nome.padEnd(17)}│`);
  }
  console.log("└─────────────────────────────┴──────────────────────┘\n");
}

seed().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
