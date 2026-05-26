import { Wallet, FileText, CheckCircle2, Banknote } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DOTACOES_MOCK, formatBRL } from "@/lib/orcamento/mock";

/**
 * Cards de execução orçamentária: Dotação, Empenhado, Liquidado, Pago.
 * Renderizado como Server Component (cálculos a partir do mock).
 */
export function CardsExecucao() {
  const totais = DOTACOES_MOCK.reduce(
    (acc, d) => {
      acc.dotacao += d.valorDotacao;
      acc.empenhado += d.valorEmpenhado;
      acc.liquidado += d.valorLiquidado;
      acc.pago += d.valorPago;
      return acc;
    },
    { dotacao: 0, empenhado: 0, liquidado: 0, pago: 0 }
  );

  const pct = (parte: number) =>
    totais.dotacao > 0 ? ((parte / totais.dotacao) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Dotação Total"
        value={formatBRL(totais.dotacao)}
        description="Autorizado pela LOA 2026"
        icon={Wallet}
        variant="info"
      />
      <KpiCard
        label="Empenhado"
        value={formatBRL(totais.empenhado)}
        description={`${pct(totais.empenhado)}% da dotação`}
        icon={FileText}
        variant="warning"
      />
      <KpiCard
        label="Liquidado"
        value={formatBRL(totais.liquidado)}
        description={`${pct(totais.liquidado)}% da dotação`}
        icon={CheckCircle2}
        variant="default"
      />
      <KpiCard
        label="Pago"
        value={formatBRL(totais.pago)}
        description={`${pct(totais.pago)}% da dotação`}
        icon={Banknote}
        variant="success"
      />
    </div>
  );
}
