import type { Metadata } from "next";
import { BarChart3, Download, Calendar, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Relatórios",
};

const relatorios = [
  {
    titulo: "Relatório Executivo",
    descricao: "Visão consolidada de todas as ações para o Prefeito",
    icone: BarChart3,
    cor: "text-primary-600 bg-primary-50",
  },
  {
    titulo: "Execução por Secretaria",
    descricao: "Ranking de execução física e financeira por pasta",
    icone: FileText,
    cor: "text-emerald-600 bg-emerald-50",
  },
  {
    titulo: "Mensal Consolidado",
    descricao: "Resumo mensal para Câmara e Controle Interno",
    icone: Calendar,
    cor: "text-amber-600 bg-amber-50",
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Gere relatórios consolidados para gestão e prestação de contas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {relatorios.map((rel) => (
          <div
            key={rel.titulo}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`${rel.cor} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <rel.icone className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{rel.titulo}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rel.descricao}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Gerar relatório
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
