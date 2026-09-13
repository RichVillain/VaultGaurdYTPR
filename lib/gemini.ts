import { GoogleGenAI } from "@google/genai";
import type { Cluster, Video } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/** True when GEMINI_API_KEY is configured, so callers can degrade instead of throwing mid-request. */
export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function sequentialFallback(videos: Video[]): Cluster[] {
  const mid = Math.max(1, Math.ceil(videos.length / 2));
  return [
    { name: "Branch A", videoIds: videos.slice(0, mid).map((v) => v.id) },
    { name: "Branch B", videoIds: videos.slice(mid).map((v) => v.id) },
  ].filter((c) => c.videoIds.length > 0);
}

/**
 * Groups video titles into named topic branches. This is the engine swap:
 * the original app used TF-IDF + KMeans; this asks Gemini to read the titles
 * and name the clusters the way a researcher would, not the way a vectorizer
 * would.
 */
export async function clusterTopics(videos: Video[]): Promise<Cluster[]> {
  const ai = client();
  if (!ai || videos.length < 4) return sequentialFallback(videos);

  const listing = videos.map((v) => `${v.id}: ${v.title}`).join("\n");
  const prompt = [
    "Group these YouTube videos into 2-6 topic clusters based on their titles.",
    "Return strict JSON only, no prose, no markdown fences, matching this shape:",
    '{"clusters":[{"name":"short topic name","video_ids":["id1","id2"]}]}',
    "Every video id must appear in exactly one cluster. Cluster names should be short (2-4 words) and specific to the content, not generic.",
    "",
    "Videos:",
    listing,
  ].join("\n");

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: { role: "user", parts: [{ text: prompt }] },
      config: { temperature: 0.3, maxOutputTokens: 2048 },
    });
    const text = (res.text ?? "").trim().replace(/^```json?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text) as { clusters: { name: string; video_ids: string[] }[] };
    const clusters = parsed.clusters
      .map((c) => ({ name: c.name, videoIds: c.video_ids }))
      .filter((c) => c.videoIds.length > 0);
    return clusters.length >= 1 ? clusters : sequentialFallback(videos);
  } catch {
    return sequentialFallback(videos);
  }
}

/**
 * Synthesizes a source-attributed research brief from selected sources'
 * video titles, per the "packets" feature — a real Gemini call rather than
 * the placeholder text the UI mockup shipped with.
 */
export async function synthesizePacket(question: string, sourceSummaries: { title: string; videos: string[] }[]) {
  const ai = client();
  if (!ai) {
    return "GEMINI_API_KEY is not configured, so this packet is a placeholder. Set GEMINI_API_KEY on the server to generate real research briefs.";
  }

  const evidence = sourceSummaries
    .map((s) => `Source: ${s.title}\nVideos:\n${s.videos.map((v) => `  - ${v}`).join("\n")}`)
    .join("\n\n");

  const prompt = [
    `Research question: ${question}`,
    "",
    "Using only the evidence below (video titles from the selected sources), write a short research brief:",
    "- 2-3 sentence synthesis answering the question",
    "- Key themes as bullet points, each citing which source(s) support it",
    "- One paragraph noting gaps or claims that need a timestamped rewatch to verify",
    "",
    "Evidence:",
    evidence,
  ].join("\n");

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: { role: "user", parts: [{ text: prompt }] },
    config: { temperature: 0.4, maxOutputTokens: 1024 },
  });
  return res.text ?? "";
}

const REPURPOSE_PROMPTS: Record<string, string> = {
  shorts: "Write a YouTube Shorts script outline: a 3-second hook, 3-4 retention beats, and on-screen text cues.",
  linkedin: "Write a professional LinkedIn post (150-200 words) sharing the insight, ending with a question to the audience.",
  x: "Write a 6-8 post X/Twitter thread, each post under 240 characters, building from hook to takeaway.",
  newsletter: "Write a newsletter section (150-250 words) with a compelling subhead, in a conversational but informed voice.",
};

/** Drafts a repurposed piece of copy from a source's titles. Title-based, not full-transcript-based — flagged in the output. */
export async function draftRepurpose(kind: keyof typeof REPURPOSE_PROMPTS, sourceTitle: string, videoTitles: string[]) {
  const ai = client();
  if (!ai) {
    return "GEMINI_API_KEY is not configured, so this draft is a placeholder. Set GEMINI_API_KEY on the server to generate real drafts.";
  }
  const instruction = REPURPOSE_PROMPTS[kind] ?? REPURPOSE_PROMPTS.linkedin;
  const prompt = [
    `Source: "${sourceTitle}"`,
    "Video titles in this source:",
    ...videoTitles.slice(0, 40).map((t) => `- ${t}`),
    "",
    instruction,
    "Base this only on the titles given — do not invent facts, statistics, or quotes not implied by them.",
  ].join("\n");

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: { role: "user", parts: [{ text: prompt }] },
    config: { temperature: 0.6, maxOutputTokens: 700 },
  });
  return res.text ?? "";
}
