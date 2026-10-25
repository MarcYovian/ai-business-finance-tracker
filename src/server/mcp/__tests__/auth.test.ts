import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashApiKey, authenticateMcpRequest } from "../auth";

// Mock Supabase createClient
const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe("MCP Auth Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VITE_SUPABASE_URL = "https://mock.supabase.co";
    process.env.VITE_SUPABASE_ANON_KEY = "mock-anon-key";
  });

  describe("hashApiKey", () => {
    it("should generate a consistent SHA-256 hex string", async () => {
      const key = "afi_live_1234567890abcdef";
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it("should trim whitespace before hashing", async () => {
      const key = "  afi_live_test  ";
      const hashTrimmed = await hashApiKey("afi_live_test");
      const hashUntrimmed = await hashApiKey(key);

      expect(hashUntrimmed).toBe(hashTrimmed);
    });
  });

  describe("authenticateMcpRequest", () => {
    it("should throw error if Authorization header is missing", async () => {
      await expect(authenticateMcpRequest(null)).rejects.toThrow(
        "Header 'Authorization: Bearer <api_key>' wajib disertakan"
      );
    });

    it("should throw error if token is empty after removing Bearer", async () => {
      await expect(authenticateMcpRequest("Bearer   ")).rejects.toThrow(
        "Token API Key tidak boleh kosong"
      );
    });

    it("should authenticate valid personal API Key (afi_live_*) via verify_api_key RPC", async () => {
      mockRpc.mockResolvedValue({
        data: "user-uuid-1234",
        error: null,
      });

      const result = await authenticateMcpRequest("Bearer afi_live_secretkey123");

      expect(result.userId).toBe("user-uuid-1234");
      expect(result.authMethod).toBe("api_key");
      expect(mockRpc).toHaveBeenCalledWith("verify_api_key", {
        p_key_hash: expect.any(String),
      });
    });

    it("should reject invalid/revoked personal API Key", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        authenticateMcpRequest("Bearer afi_live_invalidkey")
      ).rejects.toThrow("API Key tidak valid atau telah dinonaktifkan");
    });

    it("should authenticate standard Supabase JWT token", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "jwt-user-5678", email: "user@example.com" },
        },
        error: null,
      });

      const result = await authenticateMcpRequest("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token");

      expect(result.userId).toBe("jwt-user-5678");
      expect(result.authMethod).toBe("jwt");
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("should reject expired/invalid JWT token", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Token expired" },
      });

      await expect(
        authenticateMcpRequest("Bearer eyJexpiredToken")
      ).rejects.toThrow("Token autentikasi tidak valid atau sudah kedaluwarsa");
    });
  });
});
