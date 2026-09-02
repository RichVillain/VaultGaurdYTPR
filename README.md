# VaultGaurdYTPR — Multi-Playlist + Smart Branches + Obsidian

Browser HTMX app for iPhone-friendly use.

## What it does

- Paste **multiple** YouTube playlist URLs (one per line)
- Extracts every video URL + title
- **Auto-topic clusters** the titles into smart branches (TF-IDF + KMeans)
- Builds a **VaultGuard-style hierarchical depository**
- One-click **Obsidian-ready vault** download (zip of markdown notes)
- Ready-to-paste **Mono** and **Branched** source lists for NotebookLM / Gemini Notebook

## Run (once on a computer / always-on machine)

```bash
cd /path/to/VaultGaurdYTPR
pip install -r requirements.txt
python app.py
```

Then from iPhone Safari:

1. Make sure iPhone is on the **same Wi-Fi** as the computer running the app
2. Find the computer’s local IP (on Mac: System Settings → Network, or run `ipconfig getifaddr en0`)
3. Open `http://YOUR-IP:5055` on the iPhone

Example: `http://192.168.1.42:5055`

No bash needed on the phone. Just the browser.

## Features

| Feature | Description |
|---------|-------------|
| Multi-playlist batch | Paste several playlist URLs at once |
| Auto-topic clustering | Groups videos by title topics into 2–6 smart branches |
| Mono NotebookLM | Single source list with every video |
| Branched NotebookLM | One source list per topic cluster |
| Obsidian export | Zip download → open as vault. Each video = note. Topic notes contain URL lists |
| Mobile UI | Sticky header, large tap targets, works on iPhone Safari |

## Vault layout

```
vault/
  20260814_031700_batch_2pl_47vids/
    00_MANIFEST.json
    01_ALL_URLS.txt
    obsidian_vault/
      00_INDEX.md
      topic_Finance_Grants.md
      dQw4w9wgXcQ.md          ← one note per video
      ...
```

## NotebookLM workflow

1. Extract
2. Copy Mono or any Branch URLs
3. NotebookLM → New notebook → Add sources → paste YouTube links
4. Chat / Studio against the sources
