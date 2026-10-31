import { SupabaseClient } from "@supabase/supabase-js";

export type AuthMethod = "session_cookie" | "api_key" | "jwt_bearer";

export interface AuthContext {
  userId: string;
  email?: string;
  authMethod: AuthMethod;
  keyHash?: string;
  scopes: string[];
  supabase: SupabaseClient;
}

export type AuthResolutionResult =
  | { success: true; context: AuthContext }
  | { success: false; error: string; statusCode: number };
