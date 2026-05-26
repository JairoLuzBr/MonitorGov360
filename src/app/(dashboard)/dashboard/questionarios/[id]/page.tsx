"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormularioDinamico } from "@/components/questionarios/formulario-dinamico";
import {
  QUESTIONARIOS_MOCK,
  TIPOS_ACAO_LABELS,
} from "@/lib/questionarios/schema";

export default function ResponderQuestionarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const questionario = useMemo(
    () => QUESTIONARIOS_MOCK.find((q) => q.id === params.id),
    [params.id]
  );

  if (!questionario) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/questionarios"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para questionários
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-700">Questionário não encontrado</h2>
          <p className="text-sm text-gray-500 mt-1">
            O questionário solicitado não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  const periodicidadeLabel = {
    semanal: "Semanal",
    quinzenal: "Quinzenal",
    mensal: "Mensal",
  }[questionario.schema.periodicidade];

  const statusClasses = {
    pendente: "bg-amber-50 text-amber-700 border-amber-200",
    em_andamento: "bg-blue-50 text-blue-700 border-blue-200",
    respondido: "bg-emerald-50 text-emerald-700 border-emerald-200",
    atrasado: "bg-red-50 text-red-700 border-red-200",
  }[questionario.status];

  const statusLabel = {
    pendente: "Pendente",
    em_andamento: "Em andamento",
    respondido: "Respondido",
    atrasado: "Atrasado",
  }[questionario.status];

  async function handleSubmit(respostas: Record<string, unknown>) {
    // TODO: enviar para Supabase quando integrarmos
    console.log("Respostas:", respostas);
    await new Promise((r) => setTimeout(r, 1200));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Voltar */}
      <Link
        href="/dashboard/questionarios"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para questionários
      </Link>

      {/* Header da ação */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 px-6 py-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                statusClasses
              )}
            >
              {statusLabel}
            </span>
            <span className="text-xs text-white/70">
              {TIPOS_ACAO_LABELS[questionario.tipoAcao]}
            </span>
            <span className="text-xs text-white/70">•</span>
            <span className="text-xs text-white/70">{periodicidadeLabel}</span>
          </div>
          <h1 className="text-xl font-bold">{questionario.acaoTitulo}</h1>
          <p className="text-sm text-white/70 mt-1">{questionario.schema.titulo}</p>
        </div>

        <div className="px-6 py-3 bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong>Ciclo:</strong> {questionario.ciclo}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong>Responsável:</strong> {questionario.responsavel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong>Perguntas:</strong> {questionario.schema.perguntas.length}
            </span>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-900 leading-relaxed">{questionario.schema.descricao}</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <FormularioDinamico
          schema={questionario.schema}
          onSubmit={async (respostas) => {
            await handleSubmit(respostas);
            // Redireciona após sucesso (componente já mostra tela de sucesso por 1s)
            setTimeout(() => router.push("/dashboard/questionarios"), 2500);
          }}
        />
      </div>
    </div>
  );
}
