import { EMPENHOS_MOCK, formatBRL, type StatusEmpenho } from "@/lib/orcamento/mock";
import { cn } from "@/lib/utils";

interface TabelaEmpenhosProps {
  limit?: number;
}

const STATUS_CONFIG: Record<
  StatusEmpenho,
  { label: string; classes: string }
> = {
  ativo:     { label: "Ativo",     classes: "bg-blue-50 text-blue-700 border-blue-200" },
  liquidado: { label: "Liquidado", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  pago:      { label: "Pago",      classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  anulado:   { label: "Anulado",   classes: "bg-red-50 text-red-700 border-red-200" },
};

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Tabela responsiva de empenhos.
 * Ordenada por data desc (mais recentes primeiro).
 */
export function TabelaEmpenhos({ limit }: TabelaEmpenhosProps) {
  const ordenados = [...EMPENHOS_MOCK].sort((a, b) =>
    b.data.localeCompare(a.data)
  );
  const exibidos = limit ? ordenados.slice(0, limit) : ordenados;
  const total = EMPENHOS_MOCK.length;

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Número
              </th>
              <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Data
              </th>
              <th className="text-left font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Fornecedor
              </th>
              <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Empenhado
              </th>
              <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Liquidado
              </th>
              <th className="text-right font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Pago
              </th>
              <th className="text-center font-semibold text-gray-600 text-xs uppercase tracking-wide px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exibidos.map((emp) => {
              const cfg = STATUS_CONFIG[emp.status];
              return (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 whitespace-nowrap">
                    {emp.numero}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatarData(emp.data)}
                  </td>
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="font-medium text-gray-800 truncate max-w-[260px]">
                      {emp.fornecedor}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {emp.cnpj}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-800 whitespace-nowrap">
                    {formatBRL(emp.valorEmpenhado)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatBRL(emp.valorLiquidado)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatBRL(emp.valorPago)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
                        cfg.classes
                      )}
                    >
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {limit !== undefined && total > exibidos.length && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 text-center">
          Mostrando {exibidos.length} de {total} empenhos
        </div>
      )}
    </div>
  );
}
