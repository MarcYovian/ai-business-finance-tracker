import { resolveAuthContext } from "@/server/auth/resolver";
import { FinancialInsightDomainService } from "@/server/domain/insights/insight.service";
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
  const query = url.searchParams.get("query") || undefined;
  const month = url.searchParams.get("month") || undefined;

  try {
    const service = new FinancialInsightDomainService(auth.context);
    const data = await service.getFinancialAnalysis(query, month);
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
    const body = await req.json().catch(() => ({}));
    const service = new FinancialInsightDomainService(auth.context);
    const data = await service.getFinancialAnalysis(body.query, body.month);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message }, status);
  }
}
