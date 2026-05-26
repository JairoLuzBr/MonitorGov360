/**
 * Tipos gerados para o banco de dados Supabase.
 * Este arquivo será substituído pelo output do `supabase gen types typescript`
 * após as migrations serem aplicadas.
 *
 * Por ora, exporta um tipo genérico para evitar erros de compilação.
 */
export type Database = {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
  };
};
