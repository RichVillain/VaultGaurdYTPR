import { NextResponse } from "next/server";
import { listSources } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ sources: await listSources() });
}
