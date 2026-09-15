import { NextResponse } from "next/server";
import { getSource } from "@/lib/store";
import { buildObsidianVault } from "@/lib/obsidian";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let source;
  try {
    source = await getSource(id);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed to load source" }, { status: 500 });
  }
  if (!source) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const zip = await buildObsidianVault(source, source.clusters);
  const filename = `${source.title.replace(/[^\w-]+/g, "_").slice(0, 60) || "vault"}_obsidian.zip`;

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
