/**
 * Script para criar usuário de teste com dados corretos
 * Executa: npm run seed-test
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

// Carrega .env.local
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
  console.error("❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedTestUser() {
  try {
    console.log("🌱 Iniciando seed de usuário de teste...\n");

    // 1. Buscar primeiro município existente
    console.log("📍 Buscando município existente...");
    const { data: municipios, error: municipioError } = await supabase
      .from("municipios")
      .select("id, nome")
      .limit(1);

    if (municipioError || !municipios || municipios.length === 0) {
      console.error("❌ Nenhum município encontrado na tabela");
      process.exit(1);
    }

    const municipio = municipios[0];
    console.log(`✅ Usando município: ${municipio.nome} (${municipio.id})\n`);

    // 2. Criar usuário de teste via Admin API
    const testEmail = "admin@test.com";
    console.log("👤 Criando usuário de teste...");
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: "Teste@123",
      user_metadata: {
        municipio_id: municipio.id,
        perfil: "fiscal",
        primeiro_acesso: true,
        mfa_obrigatorio: false,
      },
      email_confirm: true, // Confirma email automaticamente
    });

    if (userError) {
      console.error("❌ Erro ao criar usuário:", userError.message);
      process.exit(1);
    }

    console.log("✅ Usuário criado com sucesso!\n");
    console.log("📋 Dados do teste:");
    console.log(`   Email: ${testEmail}`);
    console.log("   Senha: Teste@123");
    console.log(`   Município: ${municipio.nome}`);
    console.log("   Perfil: fiscal");
    console.log("   MFA Obrigatório: false\n");
    console.log("🎯 Próximo passo:");
    console.log("   1. Acessa http://localhost:3000/login");
    console.log(`   2. Login com ${testEmail} / Teste@123`);
    console.log("   3. Deve redirecionar para /primeiro-acesso");

  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    process.exit(1);
  }
}

seedTestUser();
