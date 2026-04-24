/**
 * Route Handler — POST/GET /api/v1/transactions
 *
 * REST API for external clients (bots, mobile, etc.)
 */

import { NextRequest } from "next/server";
import {
  createTransaction,
  listTransactions,
} from "@/lib/actions/transactions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, transaction_date } = body;

    if (!input || typeof input !== "string") {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Field 'input' is required" } },
        { status: 400 }
      );
    }

    const result = await createTransaction(input, transaction_date);

    if (!result.success) {
      return Response.json(
        { error: { code: "PARSE_ERROR", message: result.error } },
        { status: 422 }
      );
    }

    return Response.json({ data: result.data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await listTransactions({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      sort: searchParams.get("sort") ?? undefined,
      categoryId: searchParams.get("category_id") ?? undefined,
    });

    return Response.json({ data: result.data, meta: result.meta });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
