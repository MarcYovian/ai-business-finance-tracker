import { resolveAuthContext } from "@/server/auth/resolver";
import { AIChatDomainService } from "@/server/domain/ai/ai-chat.service";
import { DomainError } from "@/server/errors/domain-error";
import { jsonResponse } from "@/server/errors/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const service = new AIChatDomainService(auth.context);
    const data = await service.processChat(body);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
