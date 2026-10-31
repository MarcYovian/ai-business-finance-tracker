import { resolveAuthContext } from "@/server/auth/resolver";
import { TransactionDomainService } from "@/server/domain/transactions/transaction.service";
import { DomainError } from "@/server/errors/domain-error";
import { jsonResponse } from "@/server/errors/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as any;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined;
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : undefined;

  try {
    const service = new TransactionDomainService(auth.context);
    const data = await service.list({ type, startDate, endDate, categoryId, limit, offset });
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message }, status);
  }
}

export async function POST(req: Request) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const body = await req.json();
    const service = new TransactionDomainService(auth.context);
    const data = await service.create(body);
    return jsonResponse({ data }, 201);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, details: (err as any).details }, status);
  }
}
