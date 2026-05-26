"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2, Copy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  setupMFA,
  verifyMFA,
  getCurrentUserClient,
} from "@/lib/supabase/auth-helpers";
import type { Metadata } from "next";

// ===================================================================
// SCHEMA DE VALIDAÇÃO
// ===================================================================

const mfaSchema = z.object({
  codigo: z
    .string()
    .min(1, "Código é obrigatório")
    .regex(/^\d{6}$/, "Código deve conter 6 dígitos"),
});

type MFAFormValues = z.infer<typeof mfaSchema>;

// ===================================================================
// COMPONENTE
// ===================================================================

export default function MFAPage() {
  const router = useRouter();
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [secret, setSecret] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregandoSetup, setCarregandoSetup] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MFAFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      codigo: "",
    },
  });

  // Carrega usuário atual e setup MFA ao montar componente
  useEffect(() => {
    async function initializeMFA() {
      try {
        setCarregandoSetup(true);
        setErro(null);

        // Obtém email do usuário
        const user = await getCurrentUserClient();
        if (!user?.email) {
          setErro("Não foi possível obter dados do usuário");
          return;
        }

        setUserEmail(user.email);

        // Configura MFA
        const result = await setupMFA(user.email);

        if (result.error) {
          setErro(result.error.message);
          return;
        }

        setSecret(result.secret);
        setQrCode(result.qrCode);
        setStep("verify");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao configurar MFA";
        setErro(message);
      } finally {
        setCarregandoSetup(false);
      }
    }

    initializeMFA();
  }, []);

  // Copia secret para clipboard
  const copySecretToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Erro ao copiar secret");
    }
  };

  // Submete código MFA para verificação
  async function onSubmit(data: MFAFormValues) {
    setErro(null);
    setSucesso(null);

    try {
      if (!secret) {
        setErro("Secret não foi configurado");
        return;
      }

      // Verifica código TOTP
      const result = verifyMFA(data.codigo, secret);

      if (result.error) {
        setErro(result.error.message);
        return;
      }

      if (!result.verified) {
        setErro("Código TOTP inválido ou expirado");
        return;
      }

      setSucesso("MFA configurado com sucesso! Redirecionando...");

      // TODO: Salvar secret no user_metadata via Supabase Admin API
      // Por enquanto, apenas redireciona para dashboard
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao verificar MFA";
      setErro(message);
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
              <Shield className="h-8 w-8 text-secondary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Configurar Autenticação em Duas Etapas
          </h1>
          <p className="text-white/60 text-sm">
            Proteja sua conta com MFA (Time-based One-Time Password)
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-8">
          {carregandoSetup ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              <p className="text-gray-600">Configurando MFA...</p>
            </div>
          ) : (
            <>
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

              {step === "verify" && secret && qrCode && (
                <>
                  {/* Instruções */}
                  <div className="mb-8 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 font-medium mb-2">
                        Como configurar:
                      </p>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Abra um app autenticador (Google Authenticator, Authy, Microsoft Authenticator)</li>
                        <li>Escaneie o código QR abaixo</li>
                        <li>Insira o código de 6 dígitos gerado no app</li>
                      </ol>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-700 mb-4">
                        Escaneie com seu app autenticador:
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {qrCode && (
                          <img
                            src={qrCode}
                            alt="QR Code para MFA"
                            className="w-48 h-48"
                          />
                        )}
                      </div>
                    </div>

                    {/* Secret e Backup Codes */}
                    <div className="flex flex-col justify-center space-y-4">
                      {/* Secret em texto */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Ou insira manualmente:
                        </p>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-mono break-all">
                            {secret}
                          </code>
                          <button
                            type="button"
                            onClick={copySecretToClipboard}
                            className={cn(
                              "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                              copiado
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {copiado ? "Copiado!" : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Aviso */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <p className="font-medium mb-1">Guarde em segurança:</p>
                        <p>
                          Salve este código em um local seguro. Você precisará dele para recuperar acesso.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de verificação */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="codigo"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Digite o código de 6 dígitos
                      </label>
                      <input
                        id="codigo"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        autoComplete="off"
                        autoFocus
                        {...register("codigo")}
                        aria-invalid={!!errors.codigo}
                        aria-describedby={
                          errors.codigo ? "codigo-error" : undefined
                        }
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder:text-gray-400",
                          "text-center text-2xl font-mono tracking-widest",
                          "transition-colors duration-150 outline-none",
                          "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                          errors.codigo
                            ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                            : "border-gray-300"
                        )}
                      />
                      {errors.codigo && (
                        <p
                          id="codigo-error"
                          className="text-red-600 text-xs mt-2"
                        >
                          {errors.codigo.message}
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
                        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Ativar MFA
                        </>
                      )}
                    </button>
                  </form>

                  {/* Link para pular (apenas para servidor) */}
                  <p className="text-center text-xs text-gray-400 mt-6">
                    Você pode configurar MFA depois nas{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="text-primary-600 hover:underline"
                    >
                      preferências de segurança
                    </button>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Informação de segurança */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-medium mb-2">Por que MFA é importante?</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Protege sua conta contra acesso não autorizado</li>
          <li>Seu código muda a cada 30 segundos</li>
          <li>Funciona offline e é compatível com a maioria dos telefones</li>
        </ul>
      </div>
    </div>
  );
}
