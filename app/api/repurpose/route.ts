import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/store";
import { draftRepurpose } from "@/lib/gemini";

const VALID_KINDS = ["shorts", "linkedin", "x", "newsletter"] as const;

export const maxDuration = 60;

/** Drafts the requested content format from a stored source's video titles. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sourceId = typeof body?.sourceId === "string" ? body.sourceId : "";
  const kind = VALID_KINDS.includes(body?.kind) ? body.kind : null;

  if (!kind) return NextResponse.json({ error: "Unknown draft kind." }, { status: 400 });

  try {
    const source = await getSource(sourceId);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });

    const draft = await draftRepurpose(
      kind,
      source.title,
      source.videos.map((v) => v.title)
    );
    return NextResponse.json({ draft });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed to generate draft" }, { status: 500 });
  }
}
