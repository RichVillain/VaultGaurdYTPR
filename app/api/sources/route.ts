import { NextResponse } from "next/server";
import { listSources } from "@/lib/store";

/** Returns all stored sources, including a JSON error if storage is unavailable. */
export async function GET() {
  try {
    return NextResponse.json({ sources: await listSources() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed to load sources" }, { status: 500 });
  }
}
