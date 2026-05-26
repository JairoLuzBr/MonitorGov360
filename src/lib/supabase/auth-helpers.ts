import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import * as speakeasy from "speakeasy";
import QRCode from "qrcode";

// ===================================================================
// TIPOS E INTERFACES
// ===================================================================

export interface AuthResult {
  user: { id: string; email: string; user_metadata?: Record<string, unknown> } | null;
  error: { message: string } | null;
}

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  error: { message: string } | null;
}

export interface MFAVerifyResult {
  verified: boolean;
  error: { message: string } | null;
}

// ===================================================================
// CLIENTE SUPABASE
// ===================================================================

function createBrowserAuthClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ===================================================================
// AUTENTICAÇÃO - SIGNUP
// ===================================================================

/**
 * Registra um novo usuário no Supabase Auth
 * @param email Email do usuário
 * @param password Senha (mínimo 6 caracteres)
 * @param municipio_id ID do município
 * @param perfil Perfil do usuário (prefeito, controle_interno, servidor)
 * @returns AuthResult com user ou error
 */
export async function signupUser(
  email: string,
  password: string,
  municipio_id: string,
  perfil: "prefeito" | "controle_interno" | "servidor"
): Promise<AuthResult> {
  try {
    const supabase = createBrowserAuthClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          municipio_id,
          perfil,
          primeiro_acesso: true,
          mfa_obrigatorio: perfil === "prefeito" || perfil === "controle_interno",
        },
      },
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    if (!data.user) {
      return { user: null, error: { message: "Falha ao criar usuário" } };
    }

    // Faz login automático após signup para estabelecer sessão
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { user: null, error: { message: signInError.message } };
    }

    return {
      user: signInData.user
        ? {
            id: signInData.user.id,
            email: signInData.user.email || "",
            user_metadata: signInData.user.user_metadata,
          }
        : null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao registrar";
    return { user: null, error: { message } };
  }
}

// ===================================================================
// AUTENTICAÇÃO - SIGNIN
// ===================================================================

/**
 * Autentica um usuário existente
 * @param email Email do usuário
 * @param password Senha
 * @returns AuthResult com user ou error
 */
export async function signinUser(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserAuthClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email || "", user_metadata: data.user.user_metadata }
        : null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao fazer login";
    return { user: null, error: { message } };
  }
}

// ===================================================================
// AUTENTICAÇÃO - UPDATE PASSWORD / METADATA
// ===================================================================

/**
 * Atualiza a senha do usuário autenticado e completa o primeiro acesso
 * @param novaSenha Nova senha do usuário
 * @returns AuthResult com user atualizado ou error
 */
export async function completarPrimeiroAcesso(novaSenha: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserAuthClient();

    const { data, error } = await supabase.auth.updateUser({
      password: novaSenha,
      data: {
        primeiro_acesso: false,
      },
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email || "", user_metadata: data.user.user_metadata }
        : null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar senha";
    return { user: null, error: { message } };
  }
}

/**
 * Marca MFA como verificado no user_metadata
 * @returns AuthResult com user atualizado ou error
 */
export async function marcarMFAVerificado(): Promise<AuthResult> {
  try {
    const supabase = createBrowserAuthClient();

    const { data, error } = await supabase.auth.updateUser({
      data: {
        mfa_verificado: true,
      },
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email || "", user_metadata: data.user.user_metadata }
        : null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao marcar MFA verificado";
    return { user: null, error: { message } };
  }
}

// ===================================================================
// MFA - SETUP (TOTP)
// ===================================================================

/**
 * Cria um novo secret TOTP para MFA e gera QR Code
 * @param email Email do usuário (usado como label no QR code)
 * @returns MFASetupResult com secret, qrCode ou error
 */
export async function setupMFA(email: string): Promise<MFASetupResult> {
  try {
    // Gera um novo secret TOTP
    const secret = speakeasy.generateSecret({
      name: `MonitorGov360 (${email})`,
      issuer: "MonitorGov360",
      length: 32,
    });

    if (!secret.otpauth_url) {
      return {
        secret: "",
        qrCode: "",
        error: { message: "Falha ao gerar secret TOTP" },
      };
    }

    // Gera o QR Code em formato data URL
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao configurar MFA";
    return { secret: "", qrCode: "", error: { message } };
  }
}

// ===================================================================
// MFA - VERIFY
// ===================================================================

/**
 * Verifica se o código TOTP é válido para um secret
 * @param code Código de 6 dígitos fornecido pelo usuário
 * @param secret Secret TOTP em base32
 * @returns MFAVerifyResult com status de verificação ou error
 */
export function verifyMFA(code: string, secret: string): MFAVerifyResult {
  try {
    // Remove espaços do código
    const cleanCode = code.replace(/\s/g, "");

    // Valida formato (deve ser 6 dígitos)
    if (!/^\d{6}$/.test(cleanCode)) {
      return {
        verified: false,
        error: { message: "Código deve conter 6 dígitos" },
      };
    }

    // Verifica o código TOTP
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: cleanCode,
      window: 2, // Permite variação de ±2 períodos (30s cada)
    });

    if (!verified) {
      return {
        verified: false,
        error: { message: "Código TOTP inválido ou expirado" },
      };
    }

    return {
      verified: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao verificar MFA";
    return { verified: false, error: { message } };
  }
}

// ===================================================================
// AUTENTICAÇÃO - SIGNOUT
// ===================================================================

/**
 * Desconecta o usuário atual
 * @returns Promise que resolve sem valor
 */
export async function signoutUser(): Promise<void> {
  try {
    const supabase = createBrowserAuthClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Erro ao desconectar:", err);
  }
}

// ===================================================================
// USUÁRIO ATUAL
// ===================================================================

/**
 * Obtém dados do usuário autenticado (client-side)
 * @returns Dados do usuário ou null se não autenticado
 */
export async function getCurrentUserClient() {
  try {
    const supabase = createBrowserAuthClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      user_metadata: data.user.user_metadata,
    };
  } catch {
    return null;
  }
}

// Funções server-side como getCurrentUserServer e refreshUserSession
// devem ser importadas de src/lib/supabase/server-auth.ts para evitar
// importação de "next/headers" em arquivos client-side

// ===================================================================
// VALIDAÇÃO DE SENHA
// ===================================================================

/**
 * Valida requisitos de senha
 * @param password Senha a validar
 * @returns { valid: boolean; errors: string[] }
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("A senha deve ter no mínimo 6 caracteres");
  }
  if (password.length > 72) {
    errors.push("A senha não pode exceder 72 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===================================================================
// VALIDAÇÃO DE EMAIL
// ===================================================================

/**
 * Valida formato de email
 * @param email Email a validar
 * @returns true se válido, false caso contrário
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
