import { resolveAuthContext } from "@/server/auth/resolver";
import { BudgetDomainService } from "@/server/domain/budgets/budget.service";
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
  const month = url.searchParams.get("month") || undefined;
  const history = url.searchParams.get("history") === "true";
  const withItems = url.searchParams.get("withItems") === "true";

  try {
    const service = new BudgetDomainService(auth.context);
    if (withItems) {
      const data = await service.getBudgetsWithItems();
      return jsonResponse({ data });
    }
    if (history) {
      const data = await service.getHistory();
      return jsonResponse({ data });
    }
    const data = await service.getOrCreateForMonth(month);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}

export async function POST(req: Request) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const body = await req.json();
    const service = new BudgetDomainService(auth.context);
    const data = await service.upsert(body);
    return jsonResponse({ data }, 200);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: (err as any).details }, status);
  }
}
