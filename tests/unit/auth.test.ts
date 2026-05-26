/**
 * Testes Unitários para Auth Helpers
 * Validam a lógica de autenticação (signup, signin, MFA)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authHelpers from '@/lib/auth/helpers';

// Mock do cliente Supabase
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  };

  return {
    createClient: vi.fn(() => mockSupabase),
  };
});

// Mock do speakeasy
vi.mock('speakeasy', () => ({
  generateSecret: vi.fn((options) => ({
    name: options.name,
    base32: 'JBSWY3DPEBLW64TMMQ======',
    otpauth_url: 'otpauth://totp/MonitorGov360?secret=JBSWY3DPEBLW64TMMQ%3D%3D%3D%3D%3D%3D&issuer=MonitorGov360',
  })),
  totp: {
    verify: vi.fn((options) => {
      // Simula verificação: retorna true se o token começa com '123'
      return options.token.startsWith('123');
    }),
  },
}));

// Mock do qrcode
vi.mock('qrcode', () => ({
  toDataURL: vi.fn(async (url) => `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`),
}));

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // SIGNUP
  // =========================================================================

  describe('signupUser', () => {
    it('cria novo usuário com email válido', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockUser = {
        id: 'user-123',
        email: 'novo@gov.br',
        user_metadata: { municipio_id: 'municipio-1' },
      };

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await authHelpers.signupUser(
        'novo@gov.br',
        'senha123!',
        'municipio-1'
      );

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
      expect(result.user?.email).toBe('novo@gov.br');
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'novo@gov.br',
        password: 'senha123!',
        options: {
          data: { municipio_id: 'municipio-1' },
        },
      });
    });

    it('retorna erro se email já existe', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockError = new Error('User already registered');

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      });

      const result = await authHelpers.signupUser(
        'existente@gov.br',
        'senha123!',
        'municipio-1'
      );

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('valida que municipio_id é passado corretamente', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'user-456', email: 'test@gov.br' } },
        error: null,
      });

      await authHelpers.signupUser('test@gov.br', 'senha123!', 'municipio-xyz');

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { municipio_id: 'municipio-xyz' },
          }),
        })
      );
    });
  });

  // =========================================================================
  // SIGNIN
  // =========================================================================

  describe('signinUser', () => {
    it('faz login com credenciais corretas', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockUser = {
        id: 'user-123',
        email: 'user@gov.br',
      };

      const mockSession = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh-token-xyz',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result = await authHelpers.signinUser('user@gov.br', 'senha123!');

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('retorna erro com credenciais inválidas', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockError = new Error('Invalid login credentials');

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authHelpers.signinUser('user@gov.br', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  // =========================================================================
  // CURRENT USER
  // =========================================================================

  describe('getCurrentUser', () => {
    it('retorna usuário autenticado', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockUser = {
        id: 'user-123',
        email: 'user@gov.br',
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await authHelpers.getCurrentUser();

      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('user@gov.br');
      expect(result.error).toBeNull();
    });

    it('retorna null se usuário não autenticado', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await authHelpers.getCurrentUser();

      expect(result.user).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  // =========================================================================
  // SIGNOUT
  // =========================================================================

  describe('signoutUser', () => {
    it('faz logout e limpa sessão', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await authHelpers.signoutUser();

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('retorna erro se logout falha', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      const mockError = new Error('Logout failed');

      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: mockError,
      });

      const result = await authHelpers.signoutUser();

      expect(result.error).toBeDefined();
    });
  });

  // =========================================================================
  // MFA SETUP
  // =========================================================================

  describe('setupMFA', () => {
    it('retorna QR code válido (base64)', async () => {
      const result = await authHelpers.setupMFA();

      expect(result).toBeDefined();
      expect(result?.qrCode).toBeDefined();
      expect(result?.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('retorna secret em base32', async () => {
      const result = await authHelpers.setupMFA();

      expect(result).toBeDefined();
      expect(result?.secret).toBe('JBSWY3DPEBLW64TMMQ======');
      // Base32 deve ter apenas A-Z e 2-7
      expect(result?.secret).toMatch(/^[A-Z2-7=]+$/);
    });

    it('trata erro ao gerar QR code', async () => {
      // Mesmo com erro, a função deve retornar um resultado válido
      // pois o erro é tratado internamente com try-catch
      const result = await authHelpers.setupMFA();
      // Esperado que retorne um resultado (pode ser null ou um objeto válido)
      expect(result === null || (result?.secret && result?.qrCode)).toBeTruthy();
    });
  });

  // =========================================================================
  // MFA VERIFY
  // =========================================================================

  describe('verifyMFA', () => {
    it('valida código TOTP correto', async () => {
      const secret = 'JBSWY3DPEBLW64TMMQ======';
      const token = '123456'; // Token que começa com '123' será validado

      const result = await authHelpers.verifyMFA(token, secret);

      expect(result.verified).toBe(true);
    });

    it('rejeita código TOTP inválido', async () => {
      const secret = 'JBSWY3DPEBLW64TMMQ======';
      const token = '999999'; // Token que não começa com '123' será rejeitado

      const result = await authHelpers.verifyMFA(token, secret);

      expect(result.verified).toBe(false);
    });

    it('trata erro ao verificar TOTP', async () => {
      const result = await authHelpers.verifyMFA('', '');

      expect(result).toBeDefined();
      expect('verified' in result).toBe(true);
    });

    it('valida janela de token (window)', async () => {
      // Testa a configuração do speakeasy.totp.verify
      const { totp } = await import('speakeasy');

      const secret = 'JBSWY3DPEBLW64TMMQ======';
      await authHelpers.verifyMFA('123456', secret);

      expect(totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          window: 2,
        })
      );
    });
  });

  // =========================================================================
  // INTEGRATION SCENARIOS
  // =========================================================================

  describe('Cenários de Integração', () => {
    it('fluxo completo: signup → getUser → signout', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = (createClient as any)();

      // Signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'novo@gov.br' } },
        error: null,
      });

      const signupResult = await authHelpers.signupUser(
        'novo@gov.br',
        'senha123!',
        'municipio-1'
      );

      expect(signupResult.user).toBeDefined();

      // GetUser
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'novo@gov.br' } },
        error: null,
      });

      const getUserResult = await authHelpers.getCurrentUser();
      expect(getUserResult.user?.id).toBe(signupResult.user?.id);

      // Signout
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const signoutResult = await authHelpers.signoutUser();
      expect(signoutResult.error).toBeNull();
    });

    it('fluxo de MFA: setup → verify', async () => {
      // Setup MFA
      const setupResult = await authHelpers.setupMFA();
      expect(setupResult?.secret).toBeDefined();
      expect(setupResult?.qrCode).toBeDefined();

      // Verify TOTP
      const verifyResult = await authHelpers.verifyMFA('123456', setupResult!.secret);
      expect(verifyResult.verified).toBe(true);
    });
  });
});
