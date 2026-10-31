import { resolveAuthContext } from "@/server/auth/resolver";
import { FinancialGoalDomainService } from "@/server/domain/financial-goals/financial-goal.service";
import { DomainError } from "@/server/errors/domain-error";
import { jsonResponse } from "@/server/errors/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const { id } = await params;
    const service = new FinancialGoalDomainService(auth.context);
    const data = await service.getById(id);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const { id } = await params;
    const service = new FinancialGoalDomainService(auth.context);
    await service.delete(id);
    return jsonResponse({ success: true, message: "Target finansial berhasil dihapus." });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
