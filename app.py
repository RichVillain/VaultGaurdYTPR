#!/usr/bin/env python3
"""
YouTube Playlist VaultGuard Depository + NotebookLM Source Generator
Enhanced: multi-playlist batch, auto-topic clustering, Obsidian-ready vault export
HTMX browser app – mobile-friendly (iPhone deploy ready)
"""

from flask import Flask, request, render_template_string, send_file, jsonify
import subprocess
import json
import os
import re
import zipfile
import io
from datetime import datetime
from pathlib import Path
from collections import defaultdict

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

VAULT_ROOT = Path(__file__).parent / "vault"
VAULT_ROOT.mkdir(exist_ok=True)

# ---------- Topic clustering (lightweight, no heavy model) ----------
def simple_topic_clusters(videos, n_clusters=None):
    """Cluster video titles into topics using TF-IDF + KMeans. Falls back to sequential split."""
    if len(videos) < 4:
        mid = max(1, len(videos) // 2)
        return {
            "Branch A": videos[:mid],
            "Branch B": videos[mid:]
        }

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.cluster import KMeans
        import numpy as np

        titles = [v["title"] for v in videos]
        # Clean titles
        cleaned = [re.sub(r'[^\w\s]', ' ', t.lower()) for t in titles]

        vectorizer = TfidfVectorizer(max_features=80, stop_words='english', ngram_range=(1, 2))
        X = vectorizer.fit_transform(cleaned)

        # Auto choose clusters: between 2 and min(6, len//3)
        if n_clusters is None:
            n_clusters = max(2, min(6, len(videos) // 3))

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        # Build topic names from top terms
        feature_names = vectorizer.get_feature_names_out()
        clusters = defaultdict(list)
        for idx, label in enumerate(labels):
            clusters[int(label)].append(videos[idx])

        # Name clusters by dominant words
        named = {}
        for label, vids in clusters.items():
            center = kmeans.cluster_centers_[label]
            top_idx = center.argsort()[-3:][::-1]
            words = [feature_names[i] for i in top_idx if center[i] > 0.01]
            name = " · ".join(words[:2]).title() if words else f"Topic {label+1}"
            named[name] = vids

        # If clustering produced 1 group, force split
        if len(named) < 2:
            mid = len(videos) // 2
            return {"Branch A": videos[:mid], "Branch B": videos[mid:]}

        return named
    except Exception:
        # Fallback sequential
        mid = max(1, len(videos) // 2)
        return {"Branch A": videos[:mid], "Branch B": videos[mid:]}


def extract_playlist(url):
    """Extract flat playlist via yt-dlp. Returns (title, playlist_id, videos_list) or raises."""
    cmd = ["yt-dlp", "--flat-playlist", "-J", "--no-warnings", url]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[:500] if result.stderr else "yt-dlp failed")

    data = json.loads(result.stdout)
    title = data.get("title") or data.get("id") or "Untitled Playlist"
    playlist_id = data.get("id") or "unknown"
    entries = data.get("entries") or []

    videos = []
    for i, e in enumerate(entries):
        if not e:
            continue
        vid_id = e.get("id")
        if not vid_id:
            continue
        videos.append({
            "index": i + 1,
            "id": vid_id,
            "title": e.get("title") or f"Video {vid_id}",
            "url": f"https://www.youtube.com/watch?v={vid_id}",
            "duration": e.get("duration"),
            "playlist": title,
        })
    return title, playlist_id, videos


HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>YT VaultGuard · NotebookLM Prep</title>
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  <style>
    :root {
      --bg: #0b0f14;
      --panel: #121820;
      --border: #1e2a38;
      --accent: #00d4aa;
      --accent2: #3b82f6;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --danger: #f87171;
      --vault: #1a2332;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.45;
      -webkit-text-size-adjust: 100%;
    }
    header {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border-bottom: 1px solid var(--border);
      padding: 1rem 1.25rem;
      position: sticky; top: 0; z-index: 20;
    }
    header h1 {
      font-size: 1.15rem;
      font-weight: 700;
      display: flex; align-items: center; gap: 0.5rem;
    }
    header h1 span { color: var(--accent); }
    .badge {
      background: var(--accent); color: #000;
      font-size: 0.6rem; font-weight: 800;
      padding: 0.12rem 0.4rem; border-radius: 4px;
      text-transform: uppercase;
    }
    main { max-width: 900px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .card h2 {
      font-size: 0.95rem; font-weight: 600;
      margin-bottom: 0.85rem; color: var(--accent);
    }
    label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }
    input[type="url"], textarea {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.7rem 0.9rem;
      color: var(--text);
      font-size: 0.9rem;
    }
    textarea { min-height: 90px; resize: vertical; font-family: ui-monospace, monospace; font-size: 0.8rem; }
    input:focus, textarea:focus { outline: none; border-color: var(--accent); }
    .btn-row { display: flex; gap: 0.6rem; margin-top: 0.9rem; flex-wrap: wrap; }
    button, .btn {
      background: var(--accent); color: #000;
      border: none; border-radius: 8px;
      padding: 0.65rem 1.1rem;
      font-weight: 700; font-size: 0.85rem;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    button:active { opacity: 0.85; }
    button.secondary {
      background: transparent; border: 1px solid var(--border); color: var(--text);
    }
    button.small { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
    #status {
      margin-top: 0.9rem; padding: 0.7rem 0.9rem;
      border-radius: 8px; background: var(--vault);
      border: 1px solid var(--border); font-size: 0.85rem;
      display: none;
    }
    #status.show { display: block; }
    #status.loading { border-color: var(--accent2); color: var(--accent2); }
    #status.error { border-color: var(--danger); color: var(--danger); }
    .folder {
      background: var(--vault); border: 1px solid var(--border);
      border-radius: 8px; margin-bottom: 0.6rem; overflow: hidden;
    }
    .folder-header {
      background: #16202e; padding: 0.55rem 0.85rem;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; user-select: none; font-size: 0.85rem;
    }
    .folder-body { padding: 0.4rem 0.85rem 0.6rem; display: none; }
    .folder.open .folder-body { display: block; }
    .video-item {
      display: flex; gap: 0.55rem; padding: 0.4rem 0;
      border-bottom: 1px solid var(--border); font-size: 0.82rem;
    }
    .video-item:last-child { border-bottom: none; }
    .vid-num { color: var(--muted); min-width: 1.7rem; font-size: 0.75rem; }
    .vid-title { font-weight: 500; }
    .vid-url { font-size: 0.7rem; color: var(--muted); word-break: break-all; }
    .vid-url a { color: var(--accent2); text-decoration: none; }
    .actions-bar {
      display: flex; gap: 0.45rem; flex-wrap: wrap;
      margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--border);
    }
    .hint { font-size: 0.75rem; color: var(--muted); margin-top: 0.4rem; }
    .spinner {
      display: inline-block; width: 13px; height: 13px;
      border: 2px solid var(--accent2); border-top-color: transparent;
      border-radius: 50%; animation: spin 0.7s linear infinite;
      margin-right: 0.35rem; vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    footer { text-align: center; padding: 1.5rem; color: var(--muted); font-size: 0.7rem; }
    .cluster-tag {
      display: inline-block; background: #1e3a2f; color: var(--accent);
      font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.3rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>
      <span>⬢</span> YT VaultGuard
      <span class="badge">v2</span>
    </h1>
    <div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem">
      Multi-playlist · Auto-topic branches · Obsidian export · iPhone ready
    </div>
  </header>

  <main>
    <div class="card">
      <h2>📥 Batch Ingest Playlists</h2>
      <form hx-post="/extract" hx-target="#result" hx-swap="innerHTML"
            hx-indicator="#status" hx-disabled-elt="button[type=submit]">
        <label for="playlists">YouTube Playlist URLs (one per line)</label>
        <textarea id="playlists" name="playlists" required
          placeholder="https://www.youtube.com/playlist?list=PLxxxx\nhttps://www.youtube.com/playlist?list=PLyyyy"></textarea>
        <div class="btn-row">
          <button type="submit">Extract + Cluster + Vault</button>
          <button type="button" class="secondary" onclick="document.getElementById('playlists').value=''">Clear</button>
        </div>
      </form>
      <div id="status" class="htmx-indicator">
        <span class="spinner"></span> Pulling playlists… clustering topics… building vault…
      </div>
    </div>

    <div id="result"></div>
  </main>

  <footer>
    Local-only · VaultGuard hierarchical depository · Mono + Smart Branched NotebookLM sources · Obsidian-ready
  </footer>

  <script>
    document.body.addEventListener('htmx:beforeRequest', function() {
      const s = document.getElementById('status');
      s.className = 'show loading';
      s.innerHTML = '<span class=\"spinner\"></span> Pulling playlists… clustering topics… building vault…';
    });
    document.body.addEventListener('htmx:responseError', function() {
      const s = document.getElementById('status');
      s.className = 'show error';
      s.textContent = 'Extraction failed. Check URLs and try again.';
    });
    function toggleFolder(el) {
      el.closest('.folder').classList.toggle('open');
    }
    function copyText(id) {
      const ta = document.getElementById(id);
      ta.select();
      ta.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(ta.value).then(() => {
        alert('Copied — paste into NotebookLM sources');
      }).catch(() => {
        // fallback for older iOS
        document.execCommand('copy');
        alert('Copied');
      });
    }
  </script>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML)


@app.route("/extract", methods=["POST"])
def extract():
    raw = request.form.get("playlists", "").strip()
    urls = [u.strip() for u in raw.splitlines() if u.strip() and "youtube.com" in u.lower()]
    if not urls:
        return '<div class="card"><p style="color:var(--danger)">No valid YouTube playlist URLs found.</p></div>', 400

    all_videos = []
    playlist_meta = []
    errors = []

    for url in urls:
        try:
            title, pid, vids = extract_playlist(url)
            playlist_meta.append({"title": title, "id": pid, "url": url, "count": len(vids)})
            all_videos.extend(vids)
        except Exception as e:
            errors.append(f"{url[:60]}… → {str(e)[:120]}")

    if not all_videos:
        err_html = "<br>".join(errors) if errors else "Unknown error"
        return f'<div class="card"><p style="color:var(--danger)">No videos extracted.</p><div class="hint">{err_html}</div></div>', 400

    # Re-index globally
    for i, v in enumerate(all_videos):
        v["index"] = i + 1

    # Smart topic clusters
    clusters = simple_topic_clusters(all_videos)

    # Build vault
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    vault_name = f"{stamp}_batch_{len(urls)}pl_{len(all_videos)}vids"
    vault_dir = VAULT_ROOT / vault_name
    vault_dir.mkdir(parents=True, exist_ok=True)

    # Manifest
    manifest = {
        "extracted_at": datetime.now().isoformat(),
        "playlists": playlist_meta,
        "total_videos": len(all_videos),
        "clusters": {k: [v["id"] for v in vs] for k, vs in clusters.items()},
        "videos": all_videos,
    }
    (vault_dir / "00_MANIFEST.json").write_text(json.dumps(manifest, indent=2))
    (vault_dir / "01_ALL_URLS.txt").write_text("\n".join(v["url"] for v in all_videos))

    # Obsidian-ready structure
    obsidian_dir = vault_dir / "obsidian_vault"
    obsidian_dir.mkdir(exist_ok=True)
    (obsidian_dir / "00_INDEX.md").write_text(
        f"# YouTube Vault · {stamp}\n\n"
        f"**Playlists:** {len(playlist_meta)}  ·  **Videos:** {len(all_videos)}\n\n"
        "## Topics (auto-clustered)\n\n" +
        "\n".join(f"- [[{k}]] — {len(vs)} videos" for k, vs in clusters.items()) +
        "\n\n## All Videos\n\n" +
        "\n".join(f"- [[{v['id']}]] {v['title']}" for v in all_videos)
    )

    for v in all_videos:
        note = f"""---
title: "{v['title']}"
youtube_id: {v['id']}
url: {v['url']}
playlist: "{v.get('playlist', '')}"
index: {v['index']}
---

# {v['title']}

- **URL**: [{v['url']}]({v['url']})
- **Playlist**: {v.get('playlist', '—')}

## Notes

(Add your research notes here)

## NotebookLM

Use this URL as a source in NotebookLM / Gemini Notebook.
"""
        (obsidian_dir / f"{v['id']}.md").write_text(note)

    # Cluster notes
    for cname, cvs in clusters.items():
        safe = re.sub(r'[^\w\s-]', '', cname)[:40].strip().replace(' ', '_')
        content = f"# {cname}\n\n**{len(cvs)} videos**\n\n"
        content += "\n".join(f"- [[{v['id']}]] {v['title']}" for v in cvs)
        content += "\n\n## Source URLs (for NotebookLM branch)\n\n"
        content += "\n".join(v["url"] for v in cvs)
        (obsidian_dir / f"topic_{safe}.md").write_text(content)

    # Build response HTML
    pl_summary = " · ".join(f"{p['title'][:30]} ({p['count']})" for p in playlist_meta)

    video_rows = ""
    for v in all_videos[:80]:  # limit display for mobile
        video_rows += f'''
        <div class="video-item">
          <div class="vid-num">#{v["index"]}</div>
          <div>
            <div class="vid-title">{v["title"][:90]}</div>
            <div class="vid-url"><a href="{v["url"]}" target="_blank">{v["id"]}</a></div>
          </div>
        </div>'''
    if len(all_videos) > 80:
        video_rows += f'<div class="hint">… and {len(all_videos)-80} more (full list in vault)</div>'

    # Cluster sections
    cluster_html = ""
    for cname, cvs in clusters.items():
        cid = re.sub(r'[^\w]', '', cname)[:20]
        urls_block = "\n".join(v["url"] for v in cvs)
        cluster_html += f'''
        <div style="margin-top:1.1rem">
          <h2 style="margin-bottom:0.5rem">{cname} <span class="cluster-tag">{len(cvs)} vids</span></h2>
          <textarea id="cluster-{cid}" readonly style="min-height:70px">{urls_block}</textarea>
          <div class="btn-row" style="margin-top:0.4rem">
            <button class="secondary small" onclick="copyText('cluster-{cid}')">Copy Branch Sources</button>
          </div>
        </div>'''

    all_urls = "\n".join(v["url"] for v in all_videos)
    err_note = ""
    if errors:
        err_note = f'<div class="hint" style="color:var(--danger);margin-top:0.5rem">Partial failures: {len(errors)} playlist(s)</div>'

    html = f'''
    <div class="card">
      <h2>🔐 VaultGuard Depository Ready</h2>
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.8rem">
        {len(playlist_meta)} playlist(s) · <strong style="color:var(--text)">{len(all_videos)} videos</strong><br>
        {pl_summary}<br>
        Vault: <code style="color:var(--accent)">{vault_name}</code>
      </p>
      {err_note}

      <div class="folder open">
        <div class="folder-header" onclick="toggleFolder(this)">
          <span>📁 All Videos</span>
          <span style="color:var(--muted);font-size:0.75rem">{len(all_videos)}</span>
        </div>
        <div class="folder-body">{video_rows}</div>
      </div>

      <div class="actions-bar">
        <button class="secondary" onclick="copyText('mono-urls')">Copy Mono (all)</button>
        <a href="/download_obsidian/{vault_name}" class="btn secondary" style="text-decoration:none;display:inline-block">
          ⬇ Download Obsidian Vault (.zip)
        </a>
      </div>

      <div style="margin-top:1.3rem">
        <h2>📓 Mono NotebookLM</h2>
        <p class="hint">One notebook with every video as source.</p>
        <textarea id="mono-urls" readonly>{all_urls}</textarea>
      </div>

      <div style="margin-top:1.3rem">
        <h2>🌿 Smart Topic Branches</h2>
        <p class="hint">Auto-clustered by title topics. Use each block as a separate NotebookLM notebook.</p>
        {cluster_html}
      </div>

      <p class="hint" style="margin-top:1.2rem">
        <strong>Obsidian:</strong> Download the zip → unzip → open as vault in Obsidian. Each video is a note. Topic notes contain the branch URL lists.
        <br><strong>NotebookLM:</strong> New notebook → Add sources → paste the URLs (YouTube supported natively).
      </p>
    </div>
    '''
    return html


@app.route("/download_obsidian/<vault_name>")
def download_obsidian(vault_name):
    vault_dir = VAULT_ROOT / vault_name / "obsidian_vault"
    if not vault_dir.exists():
        return "Vault not found", 404

    mem = io.BytesIO()
    with zipfile.ZipFile(mem, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in vault_dir.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(vault_dir.parent))
    mem.seek(0)
    return send_file(
        mem,
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"{vault_name}_obsidian.zip"
    )


if __name__ == "__main__":
    # Bind to 0.0.0.0 so it is reachable on local network (iPhone can hit your computer IP)
    print("YT VaultGuard v2 → http://0.0.0.0:5055")
    print("On iPhone: open http://<your-computer-local-ip>:5055")
    app.run(host="0.0.0.0", port=5055, debug=False)
