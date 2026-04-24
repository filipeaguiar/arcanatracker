/**
 * Route Handler — GET/POST /api/v1/tags
 */

import { NextRequest } from "next/server";
import { listTags, createTag } from "@/lib/actions/tags";

export async function GET() {
  try {
    const tags = await listTags();
    return Response.json({ data: tags });
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
    const { name } = body;

    if (!name) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Field 'name' is required" } },
        { status: 400 }
      );
    }

    const tag = await createTag(name);
    return Response.json({ data: tag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
