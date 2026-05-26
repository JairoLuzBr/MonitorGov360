declare module "speakeasy" {
  interface SecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  interface Secret {
    base32: string;
    hex: string;
    qr_code_ascii: string;
    otpauth_url?: string;
  }

  interface VerifyOptions {
    secret: string;
    encoding: "base32" | "hex";
    token: string;
    window?: number;
  }

  function generateSecret(options?: SecretOptions): Secret;

  namespace totp {
    function verify(options: VerifyOptions): boolean | null;
  }
}
