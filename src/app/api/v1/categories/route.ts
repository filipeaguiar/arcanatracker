/**
 * Route Handler — GET/POST /api/v1/categories
 */

import { NextRequest } from "next/server";
import { listCategories, createCategory } from "@/lib/actions/categories";

export async function GET() {
  try {
    const categories = await listCategories();
    return Response.json({ data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Fields 'name' and 'type' are required" } },
        { status: 400 }
      );
    }

    const category = await createCategory(name, type);
    return Response.json({ data: category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
