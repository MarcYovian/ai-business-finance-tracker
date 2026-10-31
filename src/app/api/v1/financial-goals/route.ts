import { resolveAuthContext } from "@/server/auth/resolver";
import { FinancialGoalDomainService } from "@/server/domain/financial-goals/financial-goal.service";
import { DomainError } from "@/server/errors/domain-error";
import { jsonResponse } from "@/server/errors/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const service = new FinancialGoalDomainService(auth.context);
    const data = await service.list();
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
    const service = new FinancialGoalDomainService(auth.context);
    const data = await service.upsert(body);
    return jsonResponse({ data }, 200);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
