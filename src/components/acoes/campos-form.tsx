"use client";

/**
 * Componentes utilitários de formulário para o cadastro de Ações.
 * Usa Tailwind direto (padrão visual do projeto).
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Section + Field wrappers
// =============================================================================

interface SecaoProps {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

export function SecaoForm({ titulo, descricao, children }: SecaoProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
        {descricao && (
          <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
        )}
      </header>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  colSpan?: 1 | 2;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  colSpan = 1,
  children,
}: FieldProps) {
  return (
    <div className={cn(colSpan === 2 && "md:col-span-2")}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-gray-700 mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

// =============================================================================
// Input
// =============================================================================

const inputBase =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400";

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(function TextInput({ className, hasError, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(inputBase, hasError && "border-red-300 focus:ring-red-500/30", className)}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(function Textarea({ className, hasError, rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBase, "resize-y", hasError && "border-red-300 focus:ring-red-500/30", className)}
      {...rest}
    />
  );
});

// =============================================================================
// Select
// =============================================================================

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }
>(function Select({ className, hasError, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cn(inputBase, hasError && "border-red-300 focus:ring-red-500/30", className)}
      {...rest}
    >
      {children}
    </select>
  );
});

// =============================================================================
// Money input (R$ 1.234,56 ↔ number)
// =============================================================================

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
}

export function MoneyInput({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = "0,00",
}: MoneyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      onChange(0);
      return;
    }
    const cents = parseInt(digits, 10);
    onChange(cents / 100);
  }

  const display = value
    ? value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          inputBase,
          "pl-10 text-right tabular-nums",
          hasError && "border-red-300 focus:ring-red-500/30"
        )}
      />
    </div>
  );
}
