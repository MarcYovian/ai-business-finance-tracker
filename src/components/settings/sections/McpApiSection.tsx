import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Copy,
  Check,
  KeyRound,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Bot,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export function McpApiSection() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/mcp`
    : 'https://your-domain.vercel.app/api/mcp';

  const activeApiKeyPlaceholder =
    newGeneratedKey || (keys[0] ? keys[0].prefix.replace('...', '') : 'afi_live_YOUR_API_KEY');

  const fetchKeys = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, name, prefix, created_at, last_used_at, is_active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch API keys:', error);
        return;
      }
      setKeys(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const generateRandomHex = (bytes: number): string => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const hashKey = async (rawKey: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateKey = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Generate secure secret token
      const randomSecret = generateRandomHex(24);
      const fullKey = `afi_live_${randomSecret}`;
      const prefix = `${fullKey.slice(0, 12)}...`;
      const keyHash = await hashKey(fullKey);

      // 2. Insert into Supabase
      const { error } = await supabase.from('user_api_keys').insert({
        user_id: user.id,
        name: keyName.trim() || 'AI Assistant',
        key_hash: keyHash,
        prefix: prefix,
        is_active: true,
      });

      if (error) {
        throw error;
      }

      setNewGeneratedKey(fullKey);
      setKeyName('');
      toast({
        title: 'API Key Berhasil Dibuat',
        description: 'Simpan key ini sekarang karena tidak akan ditampilkan lagi.',
      });

      await fetchKeys();
    } catch (err: any) {
      toast({
        title: 'Gagal membuat API Key',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'API Key Dicabut',
        description: `Key '${name}' telah dihapus dan tidak bisa digunakan lagi.`,
      });

      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      toast({
        title: 'Gagal mencabut API Key',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'endpoint') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
    toast({
      title: 'Disalin ke Clipboard',
      description: text,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview & Endpoint Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <CardTitle>Model Context Protocol (MCP) Server</CardTitle>
          </div>
          <CardDescription>
            Hubungkan AI Client (Claude Desktop, ChatGPT, Cursor, dll.) langsung ke projek Anda untuk melakukan Create, Read, dan Update transaksi finansial tanpa akses database langsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">MCP Server Streamable HTTP Endpoint</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={endpointUrl}
                className="font-mono text-xs sm:text-sm bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(endpointUrl, 'endpoint')}
                title="Salin Endpoint"
              >
                {copiedEndpoint ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Protokol: Streamable HTTP (Stateless). Kompatibel dengan semua AI client modern.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generate API Key Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <CardTitle>Generate Personal API Key</CardTitle>
          </div>
          <CardDescription>
            API Key digunakan untuk mengotentikasi request dari AI assistant ke data finansial Anda secara aman.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Nama Client (Contoh: Claude Desktop, ChatGPT Kantor)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateKey}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Membuat Key...' : 'Generate New Key'}
            </Button>
          </div>

          {/* Active Keys List */}
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-semibold text-foreground">API Keys Aktif</h4>
            {keys.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Belum ada API Key yang dibuat. Klik tombol di atas untuk membuat key pertama Anda.
              </p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/60 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{k.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {k.prefix}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')} • Terakhir digunakan:{' '}
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleString('id-ID')
                          : 'Belum pernah'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(k.id, k.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cabut
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide Snippet Card (Multi-Client Configurator) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <CardTitle>Konfigurasi AI Client (Stitch-Style)</CardTitle>
          </div>
          <CardDescription>
            Pilih AI Client favorit Anda untuk menyalin konfigurasi koneksi MCP secara instan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="cursor" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto p-1 gap-1">
              <TabsTrigger value="cursor" className="text-xs">Cursor</TabsTrigger>
              <TabsTrigger value="antigravity" className="text-xs">Antigravity</TabsTrigger>
              <TabsTrigger value="vscode" className="text-xs">VS Code</TabsTrigger>
              <TabsTrigger value="claudecode" className="text-xs">Claude Code</TabsTrigger>
              <TabsTrigger value="codex" className="text-xs">Codex</TabsTrigger>
              <TabsTrigger value="opencode" className="text-xs">OpenCode</TabsTrigger>
              <TabsTrigger value="claude" className="text-xs">Claude Desktop</TabsTrigger>
            </TabsList>

            {/* 1. Cursor */}
            <TabsContent value="cursor" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>~/.cursor/mcp.json</code> atau <code>.cursor/mcp.json</code></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          mcpServers: {
                            "finance-tracker": {
                              url: endpointUrl,
                              headers: {
                                "x-api-key": activeApiKeyPlaceholder,
                              },
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin JSON
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`{
  "mcpServers": {
    "finance-tracker": {
      "url": "${endpointUrl}",
      "headers": {
        "x-api-key": "${activeApiKeyPlaceholder}"
      }
    }
  }
}`}
              </pre>
            </TabsContent>

            {/* 2. Antigravity */}
            <TabsContent value="antigravity" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>~/.gemini/antigravity/mcp_config.json</code></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          mcpServers: {
                            "finance-tracker": {
                              serverUrl: endpointUrl,
                              headers: {
                                "x-api-key": activeApiKeyPlaceholder,
                              },
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin JSON
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`{
  "mcpServers": {
    "finance-tracker": {
      "serverUrl": "${endpointUrl}",
      "headers": {
        "x-api-key": "${activeApiKeyPlaceholder}"
      }
    }
  }
}`}
              </pre>
            </TabsContent>

            {/* 3. VS Code */}
            <TabsContent value="vscode" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>.vscode/mcp.json</code> (Cline / Roo Code / Official MCP)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          servers: {
                            "finance-tracker": {
                              type: "http",
                              url: endpointUrl,
                              headers: {
                                "x-api-key": activeApiKeyPlaceholder,
                              },
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin JSON
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`{
  "servers": {
    "finance-tracker": {
      "type": "http",
      "url": "${endpointUrl}",
      "headers": {
        "x-api-key": "${activeApiKeyPlaceholder}"
      }
    }
  }
}`}
              </pre>
            </TabsContent>

            {/* 4. Claude Code */}
            <TabsContent value="claudecode" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Jalankan di Terminal CLI Anda:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `claude mcp add finance-tracker --transport http --header "x-api-key: ${activeApiKeyPlaceholder}" ${endpointUrl}`,
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin CLI
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`claude mcp add finance-tracker \\
  --transport http \\
  --header "x-api-key: ${activeApiKeyPlaceholder}" \\
  ${endpointUrl}`}
              </pre>
            </TabsContent>

            {/* 5. Codex */}
            <TabsContent value="codex" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>config.toml</code></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `[mcp_servers.finance-tracker]\nurl = "${endpointUrl}"\n\n[mcp_servers.finance-tracker.http_headers]\n"x-api-key" = "${activeApiKeyPlaceholder}"`,
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin TOML
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`[mcp_servers.finance-tracker]
url = "${endpointUrl}"

[mcp_servers.finance-tracker.http_headers]
"x-api-key" = "${activeApiKeyPlaceholder}"`}
              </pre>
            </TabsContent>

            {/* 6. OpenCode */}
            <TabsContent value="opencode" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>opencode.json</code></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          $schema: "https://opencode.ai/config.json",
                          mcp: {
                            "finance-tracker": {
                              type: "remote",
                              url: endpointUrl,
                              enabled: true,
                              headers: {
                                "x-api-key": activeApiKeyPlaceholder,
                              },
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin JSON
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "finance-tracker": {
      "type": "remote",
      "url": "${endpointUrl}",
      "enabled": true,
      "headers": {
        "x-api-key": "${activeApiKeyPlaceholder}"
      }
    }
  }
}`}
              </pre>
            </TabsContent>

            {/* 7. Claude Desktop */}
            <TabsContent value="claude" className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>File config: <code>claude_desktop_config.json</code></span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          mcpServers: {
                            "finance-tracker": {
                              url: endpointUrl,
                              headers: {
                                "x-api-key": activeApiKeyPlaceholder,
                              },
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "endpoint"
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Salin JSON
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-[11px] overflow-x-auto text-foreground">
{`{
  "mcpServers": {
    "finance-tracker": {
      "url": "${endpointUrl}",
      "headers": {
        "x-api-key": "${activeApiKeyPlaceholder}"
      }
    }
  }
}`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal Dialog Showing the Newly Generated Key */}
      <Dialog open={!!newGeneratedKey} onOpenChange={(open) => !open && setNewGeneratedKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle>Simpan API Key Anda</DialogTitle>
            </div>
            <DialogDescription>
              Demi keamanan, API key ini <strong>hanya ditampilkan satu kali</strong>. Harap salin dan simpan di tempat yang aman.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 bg-muted rounded-md font-mono text-xs break-all border select-all">
              {newGeneratedKey}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => newGeneratedKey && copyToClipboard(newGeneratedKey, 'key')}
            >
              {copiedKey ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Salin API Key
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setNewGeneratedKey(null)}
            >
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
