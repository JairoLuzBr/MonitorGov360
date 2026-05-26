import type { Metadata } from "next";
import { FolderOpen, Plus, Filter, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Ações",
};

export default function AcoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ações Governamentais</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie as ações do município com responsáveis, prazos e evidências
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Ação
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar ações..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700">Nenhuma ação cadastrada ainda</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Comece cadastrando a primeira ação governamental do município. Você poderá vincular responsáveis, prazos, evidências e dados orçamentários.
          </p>
        </div>
      </div>
    </div>
  );
}
