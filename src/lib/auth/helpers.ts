/**
 * Helpers para autenticação com Supabase
 * Utilizados para signup, signin, MFA setup e verificação
 */

import { createClient } from '@/lib/supabase/client';
import type { AuthError, User } from '@supabase/supabase-js';

export interface SignupParams {
  email: string;
  password: string;
  municipio_id: string;
}

export interface MFASetupResponse {
  qrCode: string;
  secret: string;
}

/**
 * Cria um novo usuário com email e senha
 */
export async function signupUser(
  email: string,
  password: string,
  municipio_id: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        municipio_id,
      },
    },
  });

  return { user: data.user, error };
}

/**
 * Realiza login com email e senha
 */
export async function signinUser(
  email: string,
  password: string
): Promise<{
  user: User | null;
  session: any;
  error: AuthError | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Obtém o usuário atualmente autenticado
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  return { user: data.user, error };
}

/**
 * Realiza logout
 */
export async function signoutUser(): Promise<{ error: AuthError | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}

/**
 * Configura MFA (TOTP) - retorna QR code e secret
 */
export async function setupMFA(): Promise<MFASetupResponse | null> {
  try {
    const speakeasy = await import('speakeasy');
    const QRCode = await import('qrcode');

    const secret = speakeasy.generateSecret({
      name: 'MonitorGov360',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      qrCode,
      secret: secret.base32,
    };
  } catch (error) {
    console.error('Erro ao configurar MFA:', error);
    return null;
  }
}

/**
 * Verifica código TOTP
 */
export async function verifyMFA(
  token: string,
  secret: string
): Promise<{ verified: boolean }> {
  try {
    const speakeasy = await import('speakeasy');

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Permitir 1 token antes e depois
    });

    return { verified: !!verified };
  } catch (error) {
    console.error('Erro ao verificar TOTP:', error);
    return { verified: false };
  }
}
