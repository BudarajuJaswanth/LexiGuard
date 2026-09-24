/**
 * LexiGuard Server-Side Environment Variable Validation
 * Validates public and server-only secrets without exposing secret values.
 */

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  geminiApiKey: string;
}

export function validateEnv(isServerSide: boolean = typeof window === 'undefined'): {
  config: Partial<EnvConfig>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';

  // 1. Validate Public Variables
  if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or set to placeholder value in environment.');
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or set to placeholder value in environment.');
  }

  // 2. Validate Server-Only Secrets (only when running on server)
  if (isServerSide) {
    if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder value. Server admin actions require this key.');
    }

    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY') {
      warnings.push('GEMINI_API_KEY is missing or set to placeholder value. GenAI pipeline functionality will require this key.');
    }
  }

  return {
    config: {
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey: isServerSide ? (supabaseServiceRoleKey ? '[REDACTED_SET]' : '') : undefined,
      geminiApiKey: isServerSide ? (geminiApiKey ? '[REDACTED_SET]' : '') : undefined,
    },
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

export function getValidatedEnv(): EnvConfig {
  if (typeof window !== 'undefined') {
    throw new Error('getValidatedEnv() must only be called on the server side to protect secret values.');
  }

  const { errors, config } = validateEnv(true);

  if (errors.length > 0) {
    console.error('❌ Environment Configuration Error:\n' + errors.map(e => `  - ${e}`).join('\n'));
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  };
}
