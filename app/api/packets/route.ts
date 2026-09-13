import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { addPacket, getSource, listPackets } from "@/lib/store";
import { synthesizePacket } from "@/lib/gemini";

export async function GET() {
  return NextResponse.json({ packets: listPackets() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sourceIds: string[] = Array.isArray(body?.sourceIds) ? body.sourceIds : [];
  const question: string = typeof body?.question === "string" ? body.question : "";
  const title: string = typeof body?.title === "string" && body.title.trim() ? body.title : "Untitled packet";

  if (sourceIds.length < 2) {
    return NextResponse.json({ error: "Select at least two sources to create a research packet." }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ error: "A research question is required." }, { status: 400 });
  }

  const sources = sourceIds.map((id) => getSource(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (sources.length < 2) {
    return NextResponse.json({ error: "Selected sources could not be found." }, { status: 400 });
  }

  const brief = await synthesizePacket(
    question,
    sources.map((s) => ({ title: s.title, videos: s.videos.map((v) => v.title) }))
  );

  const packet = addPacket({
    id: randomUUID(),
    title,
    question,
    sourceIds: sources.map((s) => s.id),
    brief,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ packet });
}
