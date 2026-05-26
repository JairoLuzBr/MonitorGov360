"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCurrentUserClient } from "@/lib/supabase/auth-helpers";
import { PainelPrefeito } from "@/components/dashboard/painel-prefeito";
import { PainelSecretario } from "@/components/dashboard/painel-secretario";
import { PainelControleInterno } from "@/components/dashboard/painel-controle-interno";
import { PainelFiscal } from "@/components/dashboard/painel-fiscal";

type Perfil =
  | "prefeito"
  | "secretario"
  | "controle_interno"
  | "fiscal"
  | "gestor"
  | "engenheiro"
  | "servidor"
  | string;

function renderPainel(perfil: Perfil) {
  switch (perfil) {
    case "prefeito":
      return <PainelPrefeito />;
    case "secretario":
      return <PainelSecretario />;
    case "controle_interno":
      return <PainelControleInterno />;
    case "fiscal":
    case "gestor":
    case "engenheiro":
    case "servidor":
    default:
      return <PainelFiscal />;
  }
}

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUserClient();
        const perfilUser = (user?.user_metadata?.perfil as string) || "fiscal";
        setPerfil(perfilUser);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return renderPainel(perfil || "fiscal");
}
