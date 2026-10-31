import { handleMcpRequest } from "@/server/mcp/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return handleMcpRequest(new Request("http://localhost/api/mcp", { method: "OPTIONS" }));
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}
