/**
 * Rate limiter simples baseado em memória (sliding window).
 *
 * AVISO DE PRODUÇÃO: o Edge Runtime cria múltiplas instâncias e o estado
 * em memória não é compartilhado entre elas. Para produção real, substituir
 * por Upstash Redis (@upstash/ratelimit) ou Vercel KV. O esquema atual é
 * suficiente para deter ataques triviais e como base para integração futura.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

export interface RateLimitConfig {
  /** Janela de tempo em milissegundos */
  windowMs: number;
  /** Máximo de requisições permitidas na janela */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (existing.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.max - existing.count,
    resetAt: existing.resetAt,
  };
}

export const RATE_LIMITS = {
  // Limites por IP. Valores escolhidos para deter brute force (bots fazem
  // centenas/min) sem incomodar usuários reais que erram senha algumas vezes
  // ou redes corporativas em NAT compartilhando o mesmo IP.
  auth: { windowMs: 60_000, max: 20 },
  signup: { windowMs: 60_000, max: 10 },
} as const;

/**
 * Extrai o IP do cliente considerando headers de proxy (Vercel/Cloudflare).
 * Em desenvolvimento local pode retornar "unknown".
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
