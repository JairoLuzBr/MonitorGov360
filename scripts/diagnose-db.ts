/**
 * Diagnóstico rápido: confirma a URL do projeto Supabase em uso e
 * tenta um SELECT real em `acoes`.
 * Executa: npx ts-node --esm scripts/diagnose-db.ts
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

console.log("📡 URL Supabase em .env.local:", SUPABASE_URL);
console.log("   Project ref:", SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] ?? "?");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // 1) Pega 1 ação direto da tabela `acoes`
  const { data: acoes, error: errAcoes, count } = await supabase
    .from("acoes")
    .select("id, titulo, funcao_codigo, funcao_nome, valor_fixado, valor_pago", {
      count: "exact",
    })
    .limit(5);

  console.log("\n🔎 Tabela `acoes`:");
  if (errAcoes) {
    console.log("   ❌ erro:", errAcoes.message);
  } else {
    console.log(`   ✅ ${count} ações encontradas, amostra:`);
    acoes?.forEach((a) => {
      console.log(
        `      - ${a.id.slice(0, 8)}… ${a.titulo} | função: ${
          a.funcao_codigo ?? "—"
        } ${a.funcao_nome ?? ""} | fixado: ${a.valor_fixado} | pago: ${a.valor_pago}`
      );
    });
  }

  // 2) Conta quantas têm classificação
  const { count: comFuncao } = await supabase
    .from("acoes")
    .select("*", { count: "exact", head: true })
    .not("funcao_codigo", "is", null);

  const { count: comValor } = await supabase
    .from("acoes")
    .select("*", { count: "exact", head: true })
    .gt("valor_fixado", 0);

  console.log(`\n📊 Status atual:`);
  console.log(`   - Ações com função preenchida: ${comFuncao}`);
  console.log(`   - Ações com valor_fixado > 0:  ${comValor}`);

  console.log("\n👉 Próximos passos:");
  console.log("   - Abra https://supabase.com/dashboard e CONFIRME que o projeto");
  console.log("     selecionado é o de project ref:",
    SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1]);
  console.log("   - Se for outro projeto, o erro 42P01 faz sentido.");
}

main().catch((e) => {
  console.error("erro:", e);
  process.exit(1);
});
