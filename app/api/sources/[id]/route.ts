import { NextResponse } from "next/server";
import { getSource } from "@/lib/store";

/** Returns the stored source for the route ID, distinguishing missing data from storage failures. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const source = await getSource(id);
    if (!source) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ source });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed to load source" }, { status: 500 });
  }
}
