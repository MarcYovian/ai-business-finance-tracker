import { hashApiKey } from "@/server/auth/api-key";
import { resolveAuthContext } from "@/server/auth/resolver";
import { SupabaseClient } from "@supabase/supabase-js";

export { hashApiKey };

export interface AuthenticatedContext {
  userId: string;
  supabase: SupabaseClient;
  authMethod: "api_key" | "jwt";
  keyHash?: string;
}

/**
 * Validates the Authorization header from MCP clients by delegating to the unified auth resolver
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

  const headers = new Headers();
  headers.set("Authorization", authHeader);

  const result = await resolveAuthContext({ headers } as any);
  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    userId: result.context.userId,
    supabase: result.context.supabase,
    authMethod: result.context.authMethod === "api_key" ? "api_key" : "jwt",
    keyHash: result.context.keyHash,
  };
}
