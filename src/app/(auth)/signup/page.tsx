"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signupUser, validatePassword, validateEmail } from "@/lib/supabase/auth-helpers";
import type { Metadata } from "next";

// ===================================================================
// SCHEMA DE VALIDAÇÃO
// ===================================================================

const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("Informe um e-mail válido"),
    senha: z
      .string()
      .min(1, "Senha é obrigatória")
      .min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmaSenha: z
      .string()
      .min(1, "Confirmação de senha é obrigatória"),
    municipio_id: z
      .string()
      .min(1, "Município é obrigatório"),
    perfil: z
      .enum(["prefeito", "controle_interno", "servidor"], {
        errorMap: () => ({ message: "Selecione um perfil válido" }),
      }),
    termos: z
      .boolean()
      .refine((val) => val === true, {
        message: "Você deve aceitar os termos e condições",
      }),
  })
  .refine((data) => data.senha === data.confirmaSenha, {
    message: "As senhas não são iguais",
    path: ["confirmaSenha"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// ===================================================================
// COMPONENTE
// ===================================================================

export default function SignupPage() {
  const router = useRouter();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmaSenha, setMostrarConfirmaSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [validacoesSenha, setValidacoesSenha] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      senha: "",
      confirmaSenha: "",
      municipio_id: "",
      perfil: "servidor",
      termos: false,
    },
  });

  const senhaValue = watch("senha");

  // Valida requisitos de senha em tempo real
  const handleSenhaChange = () => {
    if (senhaValue) {
      const { errors: senhaErrors } = validatePassword(senhaValue);
      setValidacoesSenha(senhaErrors);
    } else {
      setValidacoesSenha([]);
    }
  };

  async function onSubmit(data: SignupFormValues) {
    setErro(null);
    setSucesso(null);

    try {
      // Validações adicionais
      if (!validateEmail(data.email)) {
        setErro("E-mail inválido");
        return;
      }

      const { valid, errors: senhaErrors } = validatePassword(data.senha);
      if (!valid) {
        setErro(senhaErrors.join("; "));
        return;
      }

      // Chama Supabase Auth
      const result = await signupUser(
        data.email,
        data.senha,
        data.municipio_id,
        data.perfil
      );

      if (result.error) {
        setErro(
          result.error.message.includes("already registered")
            ? "Este e-mail já está registrado. Tente fazer login."
            : result.error.message.includes("Password")
              ? "A senha não atende aos requisitos de segurança."
              : result.error.message || "Erro ao registrar usuário"
        );
        return;
      }

      setSucesso("Cadastro realizado com sucesso! Redirecionando...");

      // Aguarda um pouco para o usuário ver a mensagem
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redireciona para página de MFA ou primeiro acesso
      router.push("/primeiro-acesso");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido ao registrar";
      setErro(message);
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
              <UserPlus className="h-8 w-8 text-secondary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Criar Conta
          </h1>
          <p className="text-white/60 text-sm">
            Registre-se para acessar MonitorGov360
          </p>
        </div>

        {/* Formulário */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Mensagem de erro */}
            {erro && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Mensagem de sucesso */}
            {sucesso && (
              <div
                role="status"
                className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{sucesso}</span>
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

            {/* Campo Município */}
            <div className="space-y-1.5">
              <label
                htmlFor="municipio_id"
                className="block text-sm font-medium text-gray-700"
              >
                Município
              </label>
              <select
                id="municipio_id"
                {...register("municipio_id")}
                aria-invalid={!!errors.municipio_id}
                aria-describedby={
                  errors.municipio_id ? "municipio_id-error" : undefined
                }
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900",
                  "text-sm transition-colors duration-150 outline-none",
                  "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                  errors.municipio_id
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300"
                )}
              >
                <option value="">Selecione um município...</option>
                {/* TODO: Carregar municípios da API */}
                <option value="sao-paulo">São Paulo</option>
                <option value="rio-janeiro">Rio de Janeiro</option>
                <option value="belo-horizonte">Belo Horizonte</option>
              </select>
              {errors.municipio_id && (
                <p
                  id="municipio_id-error"
                  className="text-red-600 text-xs mt-1"
                >
                  {errors.municipio_id.message}
                </p>
              )}
            </div>

            {/* Campo Perfil */}
            <div className="space-y-1.5">
              <label
                htmlFor="perfil"
                className="block text-sm font-medium text-gray-700"
              >
                Perfil
              </label>
              <select
                id="perfil"
                {...register("perfil")}
                aria-invalid={!!errors.perfil}
                aria-describedby={errors.perfil ? "perfil-error" : undefined}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900",
                  "text-sm transition-colors duration-150 outline-none",
                  "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                  errors.perfil
                    ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300"
                )}
              >
                <option value="">Selecione um perfil...</option>
                <option value="prefeito">Prefeito</option>
                <option value="controle_interno">Controle Interno</option>
                <option value="servidor">Servidor Público</option>
              </select>
              {errors.perfil && (
                <p id="perfil-error" className="text-red-600 text-xs mt-1">
                  {errors.perfil.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("senha", { onChange: handleSenhaChange })}
                  aria-invalid={!!errors.senha}
                  aria-describedby={
                    errors.senha ? "senha-error" : "senha-requisitos"
                  }
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

              {/* Validações de senha */}
              {senhaValue && (
                <div
                  id="senha-requisitos"
                  className="bg-amber-50 border border-amber-200 rounded p-3 mt-2 space-y-1 text-xs"
                >
                  <p className="font-medium text-amber-900">
                    Requisitos de senha:
                  </p>
                  {validacoesSenha.length === 0 ? (
                    <p className="text-green-700">✓ Senha forte</p>
                  ) : (
                    validacoesSenha.map((err, idx) => (
                      <p key={idx} className="text-amber-700">
                        ✗ {err}
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmaSenha"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmaSenha"
                  type={mostrarConfirmaSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("confirmaSenha")}
                  aria-invalid={!!errors.confirmaSenha}
                  aria-describedby={
                    errors.confirmaSenha ? "confirmaSenha-error" : undefined
                  }
                  className={cn(
                    "w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                    "text-sm transition-colors duration-150 outline-none",
                    "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                    errors.confirmaSenha
                      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-300"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmaSenha((v) => !v)}
                  aria-label={
                    mostrarConfirmaSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {mostrarConfirmaSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmaSenha && (
                <p
                  id="confirmaSenha-error"
                  className="text-red-600 text-xs mt-1"
                >
                  {errors.confirmaSenha.message}
                </p>
              )}
            </div>

            {/* Checkbox Termos */}
            <div className="flex items-start gap-2">
              <input
                id="termos"
                type="checkbox"
                {...register("termos")}
                aria-invalid={!!errors.termos}
                aria-describedby={errors.termos ? "termos-error" : undefined}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
              />
              <label
                htmlFor="termos"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Concordo com os{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  termos de uso
                </a>{" "}
                e{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  política de privacidade
                </a>
              </label>
              {errors.termos && (
                <p id="termos-error" className="text-red-600 text-xs mt-1">
                  {errors.termos.message}
                </p>
              )}
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
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-600 mt-6"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Criar Conta
                </>
              )}
            </button>
          </form>

          {/* Link para login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
