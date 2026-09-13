import archiver from "archiver";
import type { Cluster, Source } from "./types";

/** Builds an Obsidian-ready vault (as a zip buffer) for one source: one note per video, plus topic and index notes. */
export async function buildObsidianVault(source: Source, clusters: Cluster[]): Promise<Buffer> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  const videosById = new Map(source.videos.map((v) => [v.id, v]));

  const indexBody = [
    `# ${source.title}`,
    "",
    `**Videos:** ${source.videos.length}`,
    "",
    "## Topics",
    "",
    ...clusters.map((c) => `- [[${c.name}]] — ${c.videoIds.length} videos`),
    "",
    "## All Videos",
    "",
    ...source.videos.map((v) => `- [[${v.id}]] ${v.title}`),
  ].join("\n");
  archive.append(indexBody, { name: "00_INDEX.md" });

  for (const video of source.videos) {
    const note = [
      "---",
      `title: "${video.title.replace(/"/g, '\\"')}"`,
      `youtube_id: ${video.id}`,
      `url: ${video.url}`,
      `playlist: "${video.playlist}"`,
      `index: ${video.index}`,
      "---",
      "",
      `# ${video.title}`,
      "",
      `- **URL**: [${video.url}](${video.url})`,
      `- **Playlist**: ${video.playlist}`,
      "",
      "## Notes",
      "",
      "(Add your research notes here)",
    ].join("\n");
    archive.append(note, { name: `${video.id}.md` });
  }

  for (const cluster of clusters) {
    const safeName = cluster.name.replace(/[^\w\s-]/g, "").slice(0, 40).trim().replace(/\s+/g, "_");
    const clusterVideos = cluster.videoIds.map((id) => videosById.get(id)).filter((v): v is NonNullable<typeof v> => Boolean(v));
    const body = [
      `# ${cluster.name}`,
      "",
      `**${clusterVideos.length} videos**`,
      "",
      ...clusterVideos.map((v) => `- [[${v.id}]] ${v.title}`),
      "",
      "## Source URLs",
      "",
      ...clusterVideos.map((v) => v.url),
    ].join("\n");
    archive.append(body, { name: `topic_${safeName || "cluster"}.md` });
  }

  void archive.finalize();
  return done;
}
