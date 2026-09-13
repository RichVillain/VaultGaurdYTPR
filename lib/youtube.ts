export function extractYouTubeId(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname.includes("youtu.be")) return url.pathname.replace(/^\//, "").split("/")[0];
    const queryId = url.searchParams.get("v");
    if (queryId) return queryId;
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? "";
  } catch {
    return "";
  }
}

export function isPlaylistUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.searchParams.has("list");
  } catch {
    return false;
  }
}

export function uniqueYouTubeIds(raw: string) {
  const seen = new Set<string>();
  return raw
    .split(/\s+/)
    .map(extractYouTubeId)
    .filter((id) => id && !seen.has(id) && seen.add(id));
}

export function normalizeUrls(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.toLowerCase().includes("youtu"));
}
