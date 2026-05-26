"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Schema de validação
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("Informe um e-mail válido"),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
  lembrar: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
      lembrar: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setErro(null);
    try {
      // TODO: Integrar com Supabase Auth
      // const supabase = createClient()
      // const { error } = await supabase.auth.signInWithPassword({
      //   email: data.email,
      //   password: data.senha,
      // })
      // if (error) throw error
      // router.push('/dashboard')

      // Simulação de loading (remover quando integrar)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Login:", data.email);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao realizar login";
      setErro(
        message.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos. Verifique seus dados e tente novamente."
          : "Ocorreu um erro inesperado. Tente novamente em alguns instantes."
      );
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Cabeçalho do card */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 px-8 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="h-8 w-8 text-secondary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            MonitorGov<span className="text-secondary-400">360</span>
          </h1>
          <p className="text-white/60 text-sm">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Formulário */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Mensagem de erro global */}
            {erro && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2"
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{erro}</span>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.gov.br"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                  "text-sm transition-colors duration-150 outline-none",
                  "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                  errors.email
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300"
                )}
              />
              {errors.email && (
                <p id="email-error" className="text-red-600 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="senha"
                  className="block text-sm font-medium text-gray-700"
                >
                  Senha
                </label>
                <Link
                  href={"/recuperar-senha" as never}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                  tabIndex={-1}
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("senha")}
                  aria-invalid={!!errors.senha}
                  aria-describedby={errors.senha ? "senha-error" : undefined}
                  className={cn(
                    "w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                    "text-sm transition-colors duration-150 outline-none",
                    "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                    errors.senha
                      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-300"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p id="senha-error" className="text-red-600 text-xs mt-1">
                  {errors.senha.message}
                </p>
              )}
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center gap-2">
              <input
                id="lembrar"
                type="checkbox"
                {...register("lembrar")}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <label
                htmlFor="lembrar"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Manter-me conectado
              </label>
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "bg-primary-600 hover:bg-primary-700 active:bg-primary-800",
                "text-white font-semibold text-sm px-6 py-3 rounded-lg",
                "transition-all duration-150 shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Acessar Plataforma
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">
                Acesso restrito
              </span>
            </div>
          </div>

          {/* Informação institucional */}
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            Plataforma de uso exclusivo para servidores e gestores municipais
            cadastrados. Em caso de problemas, contate o administrador do sistema.
          </p>
        </div>
      </div>

      {/* Link externo */}
      <p className="text-center mt-6 text-white/50 text-xs">
        Precisa de ajuda?{" "}
        <a
          href="mailto:suporte@monitorgov360.com.br"
          className="text-secondary-400 hover:text-secondary-300 underline underline-offset-2 transition-colors"
        >
          Entre em contato
        </a>
      </p>
    </div>
  );
}
