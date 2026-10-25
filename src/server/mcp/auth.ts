import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Computes a SHA-256 hash of a string using the Web Crypto API.
 * Portable across Node.js 18+, Vercel Functions, Cloudflare, and browser environments.
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AuthenticatedContext {
  userId: string;
  supabase: SupabaseClient;
  authMethod: "api_key" | "jwt";
}

/**
 * Validates the Authorization header from the MCP client.
 * Supports:
 * 1. Self-generated API Keys (e.g. `afi_live_...`)
 * 2. Supabase User JWT tokens
 */
export async function authenticateMcpRequest(
  authHeader: string | null
): Promise<AuthenticatedContext> {
  if (!authHeader) {
    throw new Error(
      "Unauthorized: Header 'Authorization: Bearer <api_key>' wajib disertakan. Dapatkan API Key Anda di menu Settings -> MCP & API Keys."
    );
  }

  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!rawToken) {
    throw new Error("Unauthorized: Token API Key tidak boleh kosong.");
  }

  // If env vars are not yet populated in process.env, try loading from .env
  if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
    try {
      if (typeof (process as any).loadEnvFile === "function") {
        (process as any).loadEnvFile();
      }
    } catch {
      // Ignore if .env doesn't exist (e.g. in Vercel where process.env is injected)
    }
  }

  // Get Supabase credentials from process.env (Vercel) or import.meta.env (Vite)
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL);

  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Server Misconfiguration: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak ditemukan.");
  }

  // Case 1: Self-generated Personal API Key (prefix `afi_`)
  if (rawToken.startsWith("afi_")) {
    const keyHash = await hashApiKey(rawToken);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Call verify_api_key RPC function
    const { data: userId, error } = await anonClient.rpc("verify_api_key", {
      p_key_hash: keyHash,
    });

    if (error || !userId) {
      throw new Error("Unauthorized: API Key tidak valid atau telah dinonaktifkan.");
    }

    // Return client with user context
    return {
      userId: userId as string,
      supabase: anonClient,
      authMethod: "api_key",
    };
  }

  // Case 2: Standard Supabase JWT token
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${rawToken}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized: Token autentikasi tidak valid atau sudah kedaluwarsa.");
  }

  return {
    userId: userData.user.id,
    supabase: userClient,
    authMethod: "jwt",
  };
}
