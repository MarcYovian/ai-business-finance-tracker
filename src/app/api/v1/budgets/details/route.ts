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
  const budgetId = url.searchParams.get("budgetId");

  if (!budgetId) {
    return jsonResponse({ error: "Parameter 'budgetId' wajib disertakan." }, 400);
  }

  try {
    const service = new BudgetDomainService(auth.context);
    const data = await service.getRawBudgetDetails(budgetId);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
