"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Key, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validatePassword,
  getCurrentUserClient,
  setupMFA,
  verifyMFA,
  completarPrimeiroAcesso,
  marcarMFAVerificado,
} from "@/lib/supabase/auth-helpers";
import type { Metadata } from "next";

// ===================================================================
// SCHEMA DE VALIDAÇÃO
// ===================================================================

const primeiroAcessoSchema = z
  .object({
    novaSenha: z
      .string()
      .min(1, "Nova senha é obrigatória")
      .min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmaNovaSenh: z
      .string()
      .min(1, "Confirmação de senha é obrigatória"),
    codigoMFA: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{6}$/.test(val), {
        message: "Código deve conter 6 dígitos",
      }),
  })
  .refine((data) => data.novaSenha === data.confirmaNovaSenh, {
    message: "As senhas não são iguais",
    path: ["confirmaNovaSenh"],
  });

type PrimeiroAcessoFormValues = z.infer<typeof primeiroAcessoSchema>;

// ===================================================================
// COMPONENTE
// ===================================================================

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmaSenha, setMostrarConfirmaSenha] = useState(false);
  const [step, setStep] = useState<"senha" | "mfa">("senha");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [validacoesSenha, setValidacoesSenha] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPerfil, setUserPerfil] = useState<string>("");
  const [mfaRequired, setMFARequired] = useState(false);
  const [mfaSetup, setMFASetup] = useState<{ secret: string; qrCode: string } | null>(null);
  const [carregandoMFA, setCarregandoMFA] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PrimeiroAcessoFormValues>({
    resolver: zodResolver(primeiroAcessoSchema),
    defaultValues: {
      novaSenha: "",
      confirmaNovaSenh: "",
      codigoMFA: "",
    },
  });

  const novaSenhaValue = watch("novaSenha");

  // Carrega dados do usuário
  useEffect(() => {
    async function loadUserData() {
      try {
        const user = await getCurrentUserClient();
        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email);
        const perfil = (user.user_metadata?.perfil as string) || "";
        setUserPerfil(perfil);

        // MFA é obrigatório para prefeito e controle_interno
        const mfaObrigatorio = perfil === "prefeito" || perfil === "controle_interno";
        setMFARequired(mfaObrigatorio);
      } catch {
        router.push("/login");
      }
    }

    loadUserData();
  }, [router]);

  // Valida requisitos de senha em tempo real
  const handleSenhaChange = () => {
    if (novaSenhaValue) {
      const { errors: senhaErrors } = validatePassword(novaSenhaValue);
      setValidacoesSenha(senhaErrors);
    } else {
      setValidacoesSenha([]);
    }
  };

  // Copia secret para clipboard
  const copySecretToClipboard = async () => {
    if (!mfaSetup?.secret) return;
    try {
      await navigator.clipboard.writeText(mfaSetup.secret);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Erro ao copiar secret");
    }
  };

  // Submete formulário (muda de step)
  async function onSubmit(data: PrimeiroAcessoFormValues) {
    setErro(null);
    setSucesso(null);

    // Step 1: Validar e salvar nova senha
    if (step === "senha") {
      try {
        // Validações
        const { valid, errors: senhaErrors } = validatePassword(data.novaSenha);
        if (!valid) {
          setErro(senhaErrors.join("; "));
          return;
        }

        // Atualiza senha + marca primeiro_acesso como concluído no Supabase
        const result = await completarPrimeiroAcesso(data.novaSenha);

        if (result.error) {
          setErro(result.error.message);
          return;
        }

        setSucesso("Senha atualizada com sucesso!");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Se MFA não é obrigatório, vai direto para dashboard
        if (!mfaRequired) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        // Se MFA é obrigatório, vai para step de configuração
        setStep("mfa");
        setSucesso(null);

        // Configura MFA automaticamente
        await configurarMFA();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar senha";
        setErro(message);
      }
    }

    // Step 2: Verificar MFA
    if (step === "mfa") {
      try {
        if (!data.codigoMFA) {
          setErro("Código MFA é obrigatório");
          return;
        }

        if (!mfaSetup?.secret) {
          setErro("MFA não foi configurado");
          return;
        }

        // Verifica código TOTP
        const result = verifyMFA(data.codigoMFA, mfaSetup.secret);

        if (result.error) {
          setErro(result.error.message);
          return;
        }

        if (!result.verified) {
          setErro("Código TOTP inválido ou expirado");
          return;
        }

        // Marca MFA como verificado no user_metadata
        const mfaResult = await marcarMFAVerificado();
        if (mfaResult.error) {
          setErro(mfaResult.error.message);
          return;
        }

        setSucesso("MFA configurado com sucesso! Redirecionando...");

        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao verificar MFA";
        setErro(message);
      }
    }
  }

  // Configura MFA
  async function configurarMFA() {
    try {
      setCarregandoMFA(true);
      setErro(null);

      const result = await setupMFA(userEmail);

      if (result.error) {
        setErro(result.error.message);
        return;
      }

      setMFASetup({
        secret: result.secret,
        qrCode: result.qrCode,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao configurar MFA";
      setErro(message);
    } finally {
      setCarregandoMFA(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Cabeçalho do card */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 px-8 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Key className="h-8 w-8 text-secondary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === "senha" ? "Complete seu Cadastro" : "Configure MFA"}
          </h1>
          <p className="text-white/60 text-sm">
            {step === "senha"
              ? "Defina uma nova senha para sua conta"
              : "Ative autenticação em duas etapas"}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-8">
          {/* Barra de progresso */}
          <div className="mb-8 flex gap-2">
            <div
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                step === "senha" ? "bg-primary-600" : "bg-green-600"
              )}
            />
            <div
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                step === "mfa" ? "bg-primary-600" : "bg-gray-200"
              )}
            />
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2 mb-6"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Mensagem de sucesso */}
          {sucesso && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2 mb-6"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{sucesso}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Step 1: Senha */}
            {step === "senha" && (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Crie uma senha forte para proteger sua conta. Você receberá requisitos de segurança durante a digitação.
                </p>

                {/* Campo Nova Senha */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="novaSenha"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="novaSenha"
                      type={mostrarSenha ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register("novaSenha", { onChange: handleSenhaChange })}
                      aria-invalid={!!errors.novaSenha}
                      aria-describedby={
                        errors.novaSenha ? "novaSenha-error" : "novaSenha-requisitos"
                      }
                      className={cn(
                        "w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                        "text-sm transition-colors duration-150 outline-none",
                        "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                        errors.novaSenha
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
                  {errors.novaSenha && (
                    <p id="novaSenha-error" className="text-red-600 text-xs mt-1">
                      {errors.novaSenha.message}
                    </p>
                  )}

                  {/* Validações de senha */}
                  {novaSenhaValue && (
                    <div
                      id="novaSenha-requisitos"
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
                    htmlFor="confirmaNovaSenh"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmaNovaSenh"
                      type={mostrarConfirmaSenha ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register("confirmaNovaSenh")}
                      aria-invalid={!!errors.confirmaNovaSenh}
                      aria-describedby={
                        errors.confirmaNovaSenh ? "confirmaNovaSenh-error" : undefined
                      }
                      className={cn(
                        "w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                        "text-sm transition-colors duration-150 outline-none",
                        "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                        errors.confirmaNovaSenh
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
                  {errors.confirmaNovaSenh && (
                    <p
                      id="confirmaNovaSenh-error"
                      className="text-red-600 text-xs mt-1"
                    >
                      {errors.confirmaNovaSenh.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: MFA */}
            {step === "mfa" && (
              <>
                {carregandoMFA ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                    <p className="text-gray-600">Configurando MFA...</p>
                  </div>
                ) : mfaSetup ? (
                  <>
                    {/* Instruções */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-900 font-medium mb-2">
                        Passo 1: Abra um app autenticador
                      </p>
                      <p className="text-sm text-blue-800 mb-3">
                        Use Google Authenticator, Authy, Microsoft Authenticator ou similar.
                      </p>
                      <p className="text-sm text-blue-900 font-medium mb-2">
                        Passo 2: Escaneie o QR code
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* QR Code */}
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <img
                            src={mfaSetup.qrCode}
                            alt="QR Code para MFA"
                            className="w-40 h-40"
                          />
                        </div>
                      </div>

                      {/* Secret */}
                      <div className="flex flex-col justify-center space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Ou insira manualmente:
                          </p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-xs font-mono break-all">
                              {mfaSetup.secret}
                            </code>
                            <button
                              type="button"
                              onClick={copySecretToClipboard}
                              className={cn(
                                "px-3 py-2 rounded-lg font-medium text-sm transition-all shrink-0",
                                copiado
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              )}
                            >
                              {copiado ? "✓" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                          <p className="font-medium">Guarde em segurança!</p>
                          <p className="text-xs mt-1">
                            Salve este código para recuperar acesso.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Campo Código MFA */}
                    <div className="space-y-2 mb-6">
                      <label
                        htmlFor="codigoMFA"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Digite o código de 6 dígitos do app
                      </label>
                      <input
                        id="codigoMFA"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        autoComplete="off"
                        autoFocus
                        {...register("codigoMFA")}
                        aria-invalid={!!errors.codigoMFA}
                        aria-describedby={
                          errors.codigoMFA ? "codigoMFA-error" : undefined
                        }
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                          "text-center text-2xl font-mono tracking-widest",
                          "transition-colors duration-150 outline-none",
                          "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                          errors.codigoMFA
                            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                            : "border-gray-300"
                        )}
                      />
                      {errors.codigoMFA && (
                        <p
                          id="codigoMFA-error"
                          className="text-red-600 text-xs mt-1"
                        >
                          {errors.codigoMFA.message}
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </>
            )}

            {/* Botão submit */}
            <button
              type="submit"
              disabled={isSubmitting || carregandoMFA}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "bg-primary-600 hover:bg-primary-700 active:bg-primary-800",
                "text-white font-semibold text-sm px-6 py-3 rounded-lg",
                "transition-all duration-150 shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-600 mt-6"
              )}
            >
              {isSubmitting || carregandoMFA ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {step === "senha" ? "Atualizando..." : "Verificando..."}
                </>
              ) : (
                <>
                  {step === "senha" ? "Continuar" : "Ativar MFA e Acessar"}
                </>
              )}
            </button>
          </form>

          {/* Link para pular MFA (se for servidor) */}
          {step === "mfa" && userPerfil === "servidor" && (
            <p className="text-center text-xs text-gray-400 mt-6">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-primary-600 hover:underline"
              >
                Configurar MFA depois
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
