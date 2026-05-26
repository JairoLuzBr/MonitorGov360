import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  trend?: {
    value: number;
    label?: string;
  };
}

const variantStyles = {
  default: { bg: "bg-gray-50", text: "text-gray-600" },
  success: { bg: "bg-emerald-50", text: "text-emerald-600" },
  warning: { bg: "bg-amber-50", text: "text-amber-600" },
  danger: { bg: "bg-red-50", text: "text-red-600" },
  info: { bg: "bg-blue-50", text: "text-blue-600" },
};

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
}: KpiCardProps) {
  const style = variantStyles[variant];
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trendPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trendPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trendPositive ? "+" : ""}
                {trend.value}%
              </span>
              {trend.label && <span className="text-xs text-gray-400">{trend.label}</span>}
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg shrink-0", style.bg, style.text)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
