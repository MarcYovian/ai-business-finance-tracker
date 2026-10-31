/**
 * Computes a SHA-256 hash of an API key string using the Web Crypto API.
 * Portable across Node.js 18+, Edge Runtime, Cloudflare, and browser environments.
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if a token matches the Personal API Key format prefix
 */
export function isPersonalApiKey(token: string): boolean {
  return token.trim().startsWith("afi_");
}
