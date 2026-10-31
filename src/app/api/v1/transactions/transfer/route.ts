import { resolveAuthContext } from "@/server/auth/resolver";
import { TransactionDomainService } from "@/server/domain/transactions/transaction.service";
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
    const body = await req.json();
    const sourceFundId = body.fromFundId || body.sourceFundId;
    const destinationFundId = body.toFundId || body.destinationFundId;
    const amount = Number(body.amount);
    const fee = body.fee !== undefined ? Number(body.fee) : 0;
    const description = body.description || "Transfer antar rekening";
    const transactionDate = body.transactionDate || body.date || new Date().toISOString();
    const notes = body.notes || null;

    const service = new TransactionDomainService(auth.context);
    const data = await service.create({
      type: "transfer",
      amount,
      fee,
      sourceFundId,
      destinationFundId,
      description,
      transactionDate,
      notes,
    });

    return jsonResponse({ data }, 201);
  } catch (err: any) {
    const status = err instanceof DomainError ? err.statusCode : 400;
    return jsonResponse({ error: err.message, code: err.code, details: err.details }, status);
  }
}
