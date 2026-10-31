import { resolveAuthContext } from "@/server/auth/resolver";
import { BeneficiaryDomainService } from "@/server/domain/beneficiaries/beneficiary.service";
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
    const service = new BeneficiaryDomainService(auth.context);
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
    const service = new BeneficiaryDomainService(auth.context);
    const data = await service.create(body);
    return jsonResponse({ data }, 201);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
