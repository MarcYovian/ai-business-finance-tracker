import { resolveAuthContext } from "@/server/auth/resolver";
import { FundSourceDomainService } from "@/server/domain/fund-sources/fund-source.service";
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
    const service = new FundSourceDomainService(auth.context);
    const data = await service.getById(id);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 500;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const service = new FundSourceDomainService(auth.context);
    const data = await service.update(id, body);
    return jsonResponse({ data });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const auth = await resolveAuthContext(req);
  if (!auth.success) {
    return jsonResponse({ error: auth.error }, auth.statusCode);
  }

  try {
    const { id } = await params;
    const service = new FundSourceDomainService(auth.context);
    await service.delete(id);
    return jsonResponse({ success: true, message: "Sumber dana berhasil dihapus." });
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
