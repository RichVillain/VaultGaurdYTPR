import { NextResponse } from "next/server";
import { getSource } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ source });
}
