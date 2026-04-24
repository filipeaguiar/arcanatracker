/**
 * Route Handler — GET /api/v1/summary
 */

import { NextRequest } from "next/server";
import { getTransactionSummary } from "@/lib/actions/transactions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const summary = await getTransactionSummary(from, to);
    return Response.json({ data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
