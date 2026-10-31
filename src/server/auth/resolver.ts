import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuthContext, AuthResolutionResult } from "./types";
import { hashApiKey, isPersonalApiKey } from "./api-key";

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return { url, anonKey };
}

/**
 * Extracts a bearer token or API key from request headers
 */
function extractTokenFromHeaders(headers: Headers | Record<string, string | string[] | undefined> | null): string | null {
  if (!headers) return null;

  if (typeof (headers as Headers).get === "function") {
    const h = headers as Headers;
    const auth = h.get("Authorization") || h.get("authorization");
    if (auth) {
      return auth.replace(/^Bearer\s+/i, "").trim();
    }
    const xApiKey = h.get("x-api-key") || h.get("X-Api-Key");
    if (xApiKey) return xApiKey.trim();
    return null;
  }

  const rawHeaders = headers as Record<string, string | string[] | undefined>;
  const authVal = rawHeaders["authorization"] || rawHeaders["Authorization"];
  const auth = Array.isArray(authVal) ? authVal[0] : authVal;
  if (auth) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }

  const apiKeyVal = rawHeaders["x-api-key"] || rawHeaders["X-Api-Key"];
  const apiKey = Array.isArray(apiKeyVal) ? apiKeyVal[0] : apiKeyVal;
  if (apiKey) return apiKey.trim();

  return null;
}

/**
 * Parses cookies from cookie header string
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift()?.trim();
    if (name) {
      const val = parts.join("=").trim();
      list[name] = decodeURIComponent(val);
    }
  });

  return list;
}

/**
 * Unified Auth Resolver that normalizes web session cookies, Bearer JWTs, and MCP personal API keys
 */
export async function resolveAuthContext(
  req?: Request | { headers: any } | null
): Promise<AuthResolutionResult> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return {
      success: false,
      error: "Server Configuration Error: URL atau Anon Key Supabase belum terkonfigurasi.",
      statusCode: 500,
    };
  }

  const headers = req ? (req as any).headers : null;
  const token = extractTokenFromHeaders(headers);

  // 1. Path: Personal API Key (prefix 'afi_')
  if (token && isPersonalApiKey(token)) {
    const keyHash = await hashApiKey(token);
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const { data: userId, error } = await anonClient.rpc("verify_api_key", {
      p_key_hash: keyHash,
    });

    if (error || !userId) {
      return {
        success: false,
        error: "Unauthorized: Personal API Key tidak valid atau telah dinonaktifkan.",
        statusCode: 401,
      };
    }

    return {
      success: true,
      context: {
        userId: userId as string,
        authMethod: "api_key",
        keyHash,
        scopes: ["*"],
        supabase: anonClient,
      },
    };
  }

  // 2. Path: Standard Supabase Bearer JWT Token
  if (token) {
    const jwtClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await jwtClient.auth.getUser(token);
    if (!error && data?.user) {
      return {
        success: true,
        context: {
          userId: data.user.id,
          email: data.user.email,
          authMethod: "jwt_bearer",
          scopes: ["*"],
          supabase: jwtClient,
        },
      };
    }

    return {
      success: false,
      error: "Unauthorized: Token autentikasi tidak valid atau sudah kedaluwarsa.",
      statusCode: 401,
    };
  }

  // 3. Path: Session Cookie (Web Next.js)
  let cookieHeader: string | null = null;
  if (headers) {
    if (typeof headers.get === "function") {
      cookieHeader = headers.get("cookie");
    } else if (headers.cookie) {
      cookieHeader = typeof headers.cookie === "string" ? headers.cookie : headers.cookie[0];
    }
  }

  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    // Find Supabase auth cookie (usually sb-<ref>-auth-token or supabase-auth-token)
    let authToken = "";
    for (const [name, val] of Object.entries(cookies)) {
      if (name.includes("-auth-token") || name === "sb-access-token") {
        try {
          // If stored as JSON string [access_token, refresh_token]
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed[0]) {
            authToken = parsed[0];
            break;
          } else if (parsed?.access_token) {
            authToken = parsed.access_token;
            break;
          }
        } catch {
          // Plain token string
          authToken = val;
          break;
        }
      }
    }

    if (authToken) {
      const cookieClient = createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${authToken}` } },
      });

      const { data, error } = await cookieClient.auth.getUser(authToken);
      if (!error && data?.user) {
        return {
          success: true,
          context: {
            userId: data.user.id,
            email: data.user.email,
            authMethod: "session_cookie",
            scopes: ["*"],
            supabase: cookieClient,
          },
        };
      }
    }
  }

  return {
    success: false,
    error: "Unauthorized: Header 'Authorization: Bearer <api_key>' wajib disertakan. Dapatkan API Key Anda di menu Settings -> MCP & API Keys.",
    statusCode: 401,
  };
}
