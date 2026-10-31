import { resolveAuthContext } from "@/server/auth/resolver";
import { FundSourceDomainService } from "@/server/domain/fund-sources/fund-source.service";
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
  const activeOnly = url.searchParams.get("activeOnly") !== "false";
  const summary = url.searchParams.get("summary") === "true";

  try {
    const service = new FundSourceDomainService(auth.context);
    if (summary) {
      const data = await service.getBalanceSummary();
      return jsonResponse({ data });
    }
    const data = await service.list(activeOnly);
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
    const service = new FundSourceDomainService(auth.context);
    const data = await service.create(body);
    return jsonResponse({ data }, 201);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, details: (err as any).details }, status);
  }
}
