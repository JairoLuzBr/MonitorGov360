"use client";

import { type LucideIcon } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, icon: Icon, children, action }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            {Icon && <Icon className="h-4 w-4 text-primary-500" />}
            {title}
          </h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ============== BAR CHART ==============

interface BarChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>;
  dataKey?: string;
  color?: string;
  height?: number;
}

export function BarChart({ data, dataKey = "value", color = "#1E3A5F", height = 280 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
          }}
          cursor={{ fill: "rgba(30, 58, 95, 0.06)" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// ============== PIE CHART ==============

interface PieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}

const PIE_COLORS = ["#1E3A5F", "#C8941A", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

export function PieChart({ data, height = 280 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          dataKey="value"
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// ============== LINE CHART ==============

interface LineChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  lines: Array<{ dataKey: string; color: string; label?: string }>;
  height?: number;
}

export function LineChart({ data, lines, height = 280 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "12px",
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={line.label || line.dataKey}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
